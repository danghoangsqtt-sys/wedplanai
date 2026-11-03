// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const migration = readFileSync('supabase-migration.sql', 'utf8');
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const plan = 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';
const auth = `CREATE ROLE anon; CREATE ROLE authenticated;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id UUID PRIMARY KEY,email TEXT,raw_user_meta_data JSONB DEFAULT '{}');
 CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
 $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;
 INSERT INTO auth.users(id) VALUES('${owner}'),('${other}');`;
let db: PGlite;
async function role(name: 'anon' | 'authenticated', uid = '') {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub','${uid}',false); SET ROLE ${name};`);
}
beforeAll(async () => { db = new PGlite(); await db.exec(auth); await db.exec(migration); });
beforeEach(async () => {
  await db.exec(`RESET ROLE; DELETE FROM public.invitation_responses; DELETE FROM public.public_invitations;
    DELETE FROM public.user_data; DELETE FROM private.plan_owners; DELETE FROM public.plan_shares;
    DELETE FROM private.ai_usage;
    INSERT INTO private.plan_owners VALUES('${plan}','${owner}');
    INSERT INTO public.user_data(id,guests) VALUES('${plan}','[{"name":"Private Guest"}]');
    INSERT INTO public.public_invitations(uid,invitation_json) VALUES('${plan}','{"rsvpEnabled":true,"guestbookEnabled":true}');`);
});
afterAll(async () => { await db?.close(); });

describe('actual PostgreSQL schema and authorization', () => {
  it('installs on a blank database and reruns without losing invitations', async () => {
    await db.exec(migration);
    expect((await db.query('select uid from public.public_invitations')).rows).toEqual([{ uid: plan }]);
    expect(readFileSync('supabase-fix-public-invitations.sql','utf8')).toBe(migration);
  });
  it('allows the mapped owner and denies a different signed-in user', async () => {
    await role('authenticated',owner);
    expect((await db.query('select id from public.user_data')).rows).toHaveLength(1);
    await role('authenticated',other);
    expect((await db.query('select id from public.user_data')).rows).toHaveLength(0);
    await expect(db.exec(`insert into public.user_data(id) values('${plan}-attacker')`)).rejects.toThrow();
  });
  it('denies anonymous private data reads/writes but allows public invitations', async () => {
    await role('anon');
    expect((await db.query('select uid from public.public_invitations')).rows).toHaveLength(1);
    await expect(db.query('select * from public.user_data')).rejects.toThrow();
    await expect(db.exec('delete from public.user_data')).rejects.toThrow();
    await expect(db.exec(`update public.public_invitations set invitation_json='{}'`)).rejects.toThrow();
  });
  it('accepts a valid RSVP with event selections without exposing its phone', async () => {
    await role('anon');
    await db.exec(`insert into public.invitation_responses(uid,kind,name,phone,attending,guest_count,selected_event_ids)
      values('${plan}','rsvp','Guest','0900000000','yes',5,ARRAY['event-a']);`);
    await expect(db.query('select phone from public.invitation_responses')).rejects.toThrow();
    await role('authenticated',owner);
    const row=(await db.query('select phone,guest_count,selected_event_ids from public.invitation_responses')).rows[0];
    expect(row).toMatchObject({ phone:'0900000000', guest_count:5, selected_event_ids:['event-a'] });
  });
  it('returns only public wish fields, never RSVP phone or email', async () => {
    await db.exec(`insert into public.invitation_responses(uid,kind,name,phone,attending) values('${plan}','rsvp','RSVP','0900000000','yes');
      insert into public.invitation_responses(uid,kind,name,message,email) values('${plan}','wish','Friend','Congratulations','private@example.test');`);
    await role('anon');
    const rows=(await db.query(`select * from public.get_public_wishes('${plan}')`)).rows;
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual(['created_at','id','message','name']);
  });
  it('acknowledges identical public retries once and rejects ID reuse with different content',async()=>{
    await role('anon');
    const response={id:'44444444-4444-4444-8444-444444444444',uid:plan,kind:'rsvp',name:'Family',attending:'yes',guest_count:5,selected_event_ids:['event-a']};
    for(let i=0;i<2;i++) expect((await db.query('select public.submit_invitation_response($1) as ok',[JSON.stringify(response)])).rows[0]).toEqual({ok:true});
    await expect(db.query('select public.submit_invitation_response($1)',[JSON.stringify({...response,name:'Changed'})])).rejects.toThrow(/already used/);
    await role('authenticated',owner);
    expect((await db.query('select id from public.invitation_responses')).rows).toHaveLength(1);
  });
  it('blocks disabled forms and invalid/unbounded submissions', async () => {
    await db.exec(`update public.public_invitations set invitation_json='{"rsvpEnabled":false,"guestbookEnabled":false}'`);
    await role('anon');
    await expect(db.exec(`insert into public.invitation_responses(uid,kind,name,attending) values('${plan}','rsvp','Spam','yes')`)).rejects.toThrow();
    await expect(db.exec(`insert into public.invitation_responses(uid,kind,name,message) values('not-published','wish','Spam','Hi')`)).rejects.toThrow();
  });
  it('saves data and public invitation atomically and rejects a stale revision', async () => {
    await role('authenticated',owner);
    const previous=(await db.query<{last_updated:string}>('select last_updated from public.user_data')).rows[0].last_updated;
    const payload={ guests:[], budgetItems:[], invitation:{groomName:'Updated'}, weddingDate:'2028-12-01' };
    await db.query('select public.save_plan($1,$2,$3)',[plan,JSON.stringify(payload),previous]);
    expect((await db.query('select invitation_json from public.public_invitations')).rows[0]).toMatchObject({ invitation_json:{groomName:'Updated'} });
    await expect(db.query('select public.save_plan($1,$2,$3)',[plan,JSON.stringify(payload),previous])).rejects.toThrow(/another device/);
  });
  it('accepts only the first empty-plan save and rejects stale saves after deletion',async()=>{
    const payload=JSON.stringify({guests:[],budgetItems:[],invitation:{groomName:'First save'}});
    await db.exec('DELETE FROM public.user_data');
    await role('authenticated',owner);
    const revision=(await db.query<{revision:string}>('select public.save_plan($1,$2,null) as revision',[plan,payload])).rows[0].revision;
    await expect(db.query('select public.save_plan($1,$2,null)',[plan,payload])).rejects.toThrow(/another device/);
    await db.exec('delete from public.user_data');
    await expect(db.query('select public.save_plan($1,$2,$3)',[plan,payload,revision])).rejects.toThrow(/another device/);
    expect((await db.query('select id from public.user_data')).rows).toHaveLength(0);
  });
  it('rolls back the public invitation when an insert-time database conflict occurs',async()=>{
    // Inject a same-statement conflict to force a PostgreSQL cardinality error.
    // This verifies rollback, not concurrent sessions (PGlite serializes them).
    await db.exec(`DELETE FROM public.user_data;
      CREATE FUNCTION public.test_interleaving() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN
        IF pg_trigger_depth()=1 THEN
          INSERT INTO public.user_data(id,last_updated) VALUES(NEW.id,clock_timestamp());
        END IF; RETURN NEW; END $$;
      CREATE TRIGGER test_interleaving BEFORE INSERT ON public.user_data
        FOR EACH ROW EXECUTE FUNCTION public.test_interleaving();`);
    try {
      await role('authenticated',owner);
      await expect(db.query('select public.save_plan($1,$2,null)',[plan,JSON.stringify({guests:[],budgetItems:[],invitation:{groomName:'Overwrite'}})])).rejects.toMatchObject({code:'21000'});
      expect((await db.query('select id from public.user_data')).rows).toHaveLength(0);
      expect((await db.query('select invitation_json from public.public_invitations')).rows[0]).toEqual({invitation_json:{rsvpEnabled:true,guestbookEnabled:true}});
    } finally {
      await db.exec('RESET ROLE;DROP TRIGGER test_interleaving ON public.user_data;DROP FUNCTION public.test_interleaving();');
    }
  });
  it('retains dashboard milestones across saved revisions and older clients that omit the field',async()=>{
    await role('authenticated',owner);
    const previous=(await db.query<{last_updated:string}>('select last_updated from public.user_data')).rows[0].last_updated;
    const tasks={m12:[{id:'task-1',title:'Book venue',notes:'Deposit on Friday',done:true}]};
    const payload={guests:[],budgetItems:[],milestoneTasks:tasks};
    const revision=(await db.query<{revision:string}>('select public.save_plan($1,$2,$3) as revision',[plan,JSON.stringify(payload),previous])).rows[0].revision;
    await db.query('select public.save_plan($1,$2,$3)',[plan,JSON.stringify({guests:[],budgetItems:[]}),revision]);
    expect((await db.query('select milestone_tasks from public.user_data')).rows[0]).toEqual({milestone_tasks:tasks});
    await role('anon');await expect(db.query('select milestone_tasks from public.user_data')).rejects.toThrow();
  });
  it('resolves share codes privately and revokes partner access on leave', async () => {
    const share=(await db.query<{id:string}>(`insert into public.plan_shares(owner_uid,share_code) values('${plan}','WED-ABCDEF') returning id`)).rows[0];
    await role('authenticated',other);
    expect((await db.query('select * from public.plan_shares')).rows).toHaveLength(0);
    await expect(db.query('select public.leave_shared_plan($1)',[share.id])).rejects.toThrow(/Access denied/);
    await db.query("select * from public.join_plan_by_code('WED-ABCDEF')");
    expect((await db.query('select id from public.user_data')).rows).toHaveLength(1);
    await db.exec('delete from public.user_data');
    expect((await db.query('select id from public.user_data')).rows).toHaveLength(1);
    await db.query('select public.leave_shared_plan($1)',[share.id]);
    expect((await db.query('select id from public.user_data')).rows).toHaveLength(0);
  });
  it('rejects malformed save payloads without replacing valid rows', async()=>{
    await role('authenticated',owner);
    const previous=(await db.query<{last_updated:string}>('select last_updated from public.user_data')).rows[0].last_updated;
    await expect(db.query('select public.save_plan($1,$2,$3)',[plan,'{}',previous])).rejects.toThrow(/Invalid plan payload/);
    expect((await db.query('select guests from public.user_data')).rows[0]).toEqual({guests:[{name:'Private Guest'}]});
  });
  it('limits AI usage atomically and denies another account', async () => {
    await role('authenticated',owner);
    for(let i=0;i<10;i++) expect((await db.query(`select public.consume_ai_quota('${plan}') as ok`)).rows[0]).toEqual({ok:true});
    expect((await db.query(`select public.consume_ai_quota('${plan}') as ok`)).rows[0]).toEqual({ok:false});
    await role('authenticated',other);
    expect((await db.query(`select public.consume_ai_quota('${plan}') as ok`)).rows[0]).toEqual({ok:false});
  });
  it('upgrades legacy UUID/FK/policies without discarding user or invitation rows', async () => {
    const legacy=new PGlite();
    try {
      await legacy.exec(auth + `
        INSERT INTO auth.users(id) VALUES('${plan}');
        CREATE TABLE public.user_data(id UUID PRIMARY KEY REFERENCES auth.users(id), guests JSONB DEFAULT '[]',budget_items JSONB DEFAULT '[]',procedures JSONB DEFAULT '{}',fengshui_profile JSONB,fengshui_results JSONB,invitation JSONB,wedding_date DATE,last_updated TIMESTAMPTZ DEFAULT now(),created_at TIMESTAMPTZ DEFAULT now());
        CREATE TABLE public.public_invitations(uid UUID PRIMARY KEY REFERENCES auth.users(id),invitation_json JSONB NOT NULL,updated_at TIMESTAMPTZ DEFAULT now());
        ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
        CREATE POLICY old_owner ON public.user_data FOR ALL USING(auth.uid()=id);
        INSERT INTO public.user_data(id,guests) VALUES('${plan}','[{"name":"Keep Me"}]');
        INSERT INTO public.public_invitations VALUES('${plan}','{"groomName":"Keep My Wedding"}',now());
      `);
      await legacy.exec(migration);
      expect((await legacy.query('select guests from public.user_data')).rows[0]).toEqual({guests:[{name:'Keep Me'}]});
      expect((await legacy.query('select invitation_json from public.public_invitations')).rows[0]).toEqual({invitation_json:{groomName:'Keep My Wedding'}});
    } finally { await legacy.close(); }
  });
  it('creates new Auth profiles without relying on the legacy UUID foreign key',async()=>{
    await db.exec("insert into auth.users(id,email) values('55555555-5555-4555-8555-555555555555','new@example.test')");
    expect((await db.query("select display_name,role from public.profiles where id='55555555-5555-4555-8555-555555555555'")).rows[0]).toEqual({display_name:'new',role:'USER'});
  });
  it('restricts writes to owner storage folders even when an old broad policy exists',async()=>{
    const storage=new PGlite();
    try {
      await storage.exec(auth+`CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id TEXT,name TEXT);
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        GRANT USAGE ON SCHEMA storage TO anon,authenticated;GRANT ALL ON storage.objects TO anon,authenticated;
        CREATE POLICY old_broad ON storage.objects FOR ALL USING(true) WITH CHECK(true);`);
      await storage.exec(migration);
      await storage.exec(`INSERT INTO private.plan_owners VALUES('${plan}','${owner}');SELECT set_config('request.jwt.claim.sub','${owner}',false);SET ROLE authenticated;`);
      await storage.exec(`INSERT INTO storage.objects VALUES('wedkho','${plan}/photo.jpg')`);
      await expect(storage.exec("INSERT INTO storage.objects VALUES('wedkho','unowned/photo.jpg')")).rejects.toThrow();
      await storage.exec("RESET ROLE;SELECT set_config('request.jwt.claim.sub','',false);SET ROLE anon;");
      await expect(storage.exec(`INSERT INTO storage.objects VALUES('wedkho','${plan}/attacker.jpg')`)).rejects.toThrow();
    } finally { await storage.close(); }
  });
});
