// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const migration = readFileSync('supabase-migration.sql', 'utf8');
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const plan = 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';
const auth = `CREATE ROLE anon; CREATE ROLE authenticated;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id UUID PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
 $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;
 INSERT INTO auth.users VALUES('${owner}'),('${other}');`;
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
        INSERT INTO auth.users VALUES('${plan}');
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
});
