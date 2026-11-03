import { AttendanceProbability, GuestGroup, type Guest } from '../types';
import type { InvitationResponse } from '../services/cloudService';

export function guestPartySize(guest:Guest):number {
  const minimum=1+Math.max(0,guest.childrenCount||0);
  return Number.isInteger(guest.partySize)&&guest.partySize!>=minimum ? guest.partySize! : minimum;
}
export function guestAdults(guest:Guest):number { return guestPartySize(guest)-Math.max(0,guest.childrenCount||0); }
export function normalizeGuest(guest:Guest):Guest {
  const name=guest.name?.trim();
  if(!guest.id || !name || name.length>100)throw new Error('Vui lòng nhập tên khách hợp lệ.');
  const partySize=guest.partySize??guestPartySize(guest);
  if(!Number.isInteger(partySize)||partySize<1||partySize>100||!Number.isInteger(guest.childrenCount)||guest.childrenCount<0||guest.childrenCount>=partySize)throw new Error('Tổng số người phải từ 1 đến 100 và lớn hơn số trẻ em.');
  if(![0,50,80,100].includes(guest.probability)||!Object.values(GuestGroup).includes(guest.group))throw new Error('Nhóm khách hoặc phản hồi chưa hợp lệ.');
  if(!Number.isSafeInteger(guest.redEnvelope)||guest.redEnvelope<0)throw new Error('Tiền mừng phải là số nguyên không âm.');
  if(guest.invitationStatus!==undefined&&!['not_sent','sent'].includes(guest.invitationStatus))throw new Error('Tình trạng gửi thiệp chưa hợp lệ.');
  for(const [key,max] of [['phone',30],['address',200],['tableName',50],['notes',2000]] as const) {
    if(guest[key]!==undefined&&(typeof guest[key]!=='string'||guest[key]!.length>max))throw new Error('Thông tin liên hệ hoặc ghi chú quá dài.');
  }
  return {...guest,name,partySize,phone:guest.phone?.trim()||undefined,address:guest.address?.trim()||undefined,tableName:guest.tableName?.trim()||undefined,notes:guest.notes?.trim()||undefined};
}
export function guestFromRsvp(response:InvitationResponse,id:string):Guest {
  const size=Math.max(1,Math.min(100,Math.trunc(response.guestCount||1)));
  return {id,name:response.name.trim().slice(0,100),group:GuestGroup.FRIEND,
    probability:response.attending==='yes'?AttendanceProbability.CONFIRMED:AttendanceProbability.UNLIKELY,
    partySize:size,childrenCount:0,redEnvelope:500000*size,sourceRsvpId:response.id,
    phone:response.phone?.trim()||undefined,notes:response.message?.trim()||undefined,invitationStatus:'sent'};
}
