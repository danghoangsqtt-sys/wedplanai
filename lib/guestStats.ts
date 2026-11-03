import { AttendanceProbability, GuestGroup, type Guest } from '../types';
import type { InvitationResponse } from '../services/cloudService';

export function guestPartySize(guest:Guest):number {
  const minimum=1+Math.max(0,guest.childrenCount||0);
  return Number.isInteger(guest.partySize)&&guest.partySize!>=minimum ? guest.partySize! : minimum;
}
export function guestAdults(guest:Guest):number { return guestPartySize(guest)-Math.max(0,guest.childrenCount||0); }
export function guestFromRsvp(response:InvitationResponse,id:string):Guest {
  const size=Math.max(1,Math.min(100,Math.trunc(response.guestCount||1)));
  return {id,name:response.name.trim().slice(0,100),group:GuestGroup.FRIEND,
    probability:response.attending==='yes'?AttendanceProbability.CONFIRMED:AttendanceProbability.UNLIKELY,
    partySize:size,childrenCount:0,redEnvelope:500000*size,sourceRsvpId:response.id};
}
