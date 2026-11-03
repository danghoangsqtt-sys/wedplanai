import React from 'react';
import { DEFAULT_SECTION_ORDER, type InvitationData, type SectionId } from '../types';

export function invitationSectionOrder(data:Pick<InvitationData,'sectionOrder'>):SectionId[] {
  const known=new Set<string>(DEFAULT_SECTION_ORDER);
  return [...new Set([...(Array.isArray(data.sectionOrder)?data.sectionOrder:[]),...DEFAULT_SECTION_ORDER])]
    .filter((id):id is SectionId=>known.has(id));
}

// Reorder the React tree itself so keyboard/screen-reader order matches visuals.
// Non-section decorations before/after the content keep their existing positions.
export function renderInvitationSections(children:React.ReactNode,data:InvitationData):React.ReactNode {
  const prefix:React.ReactNode[]=[];const suffix:React.ReactNode[]=[];
  const sections=new Map<SectionId,React.ReactElement>();let foundSection=false;
  function collect(nodes:React.ReactNode) {
    React.Children.forEach(nodes,node=>{
      if(!React.isValidElement<{children?:React.ReactNode;'data-sec'?:SectionId}>(node)) return;
      if(node.type===React.Fragment) { collect(node.props.children);return; }
      const id=node.props['data-sec'];
      if(id) { foundSection=true;sections.set(id,React.cloneElement(node,{key:'section:'+id})); }
      else (foundSection?suffix:prefix).push(React.cloneElement(node,{key:'decoration:'+(prefix.length+suffix.length)}));
    });
  }
  collect(children);
  return [...prefix,...invitationSectionOrder(data).filter(id=>data.sectionVisibility?.[id]!==false).map(id=>sections.get(id)),...suffix];
}
