const fs = require('fs');

const path = 'components/invitation/InvitationPreview.tsx';
let content = fs.readFileSync(path, 'utf8');

const pattern = /<(\w+)([^>]*?)\{\.\.\.editProps\(([^,]+)(?:,\s*([^)]+))?\)\}>([\s\S]*?)<\/\1>/g;

content = content.replace(pattern, (match, tag, before, field, placeholder, inner) => {
    let val = inner.trim();
    if (val.startsWith('{') && val.endsWith('}')) {
        val = val.substring(1, val.length - 1);
    } else {
        val = `"${val.replace(/"/g, '\\"')}"`;
    }
    
    const placeholderVal = placeholder ? placeholder.trim() : 'undefined';
    const beforeClean = before.trim();
    
    return `<InlineRichText tagName="${tag}" field={${field.trim()}} placeholder={${placeholderVal}} value={${val}} ec={ec} ${beforeClean} />`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced editProps');
