const fs = require('fs');

const path = 'components/invitation/InvitationPreview.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to add the import for InlineRichText
if (!content.includes('InlineRichText')) {
    content = content.replace(
        "import { Heart, MapPin, Calendar, Clock, Quote, Camera, Music, Play, Pause, ChevronDown, CheckCircle, X } from 'lucide-react';",
        "import { Heart, MapPin, Calendar, Clock, Quote, Camera, Music, Play, Pause, ChevronDown, CheckCircle, X } from 'lucide-react';\nimport { InlineRichText } from './InlineRichText';"
    );
}

// Replace <span {...richEditProps('...', '...')} dangerouslySetInnerHTML={{ __html: ... }} />
// Example: <span {...richEditProps('date', 'Ngày')} dangerouslySetInnerHTML={{ __html: data.date }} />
// regex pattern to match this structure, allowing optional style and className

const pattern = /<(\w+)([^>]*?)\{\.\.\.richEditProps\(([^,]+)(?:,\s*([^)]+))?\)\}([^>]*?)dangerouslySetInnerHTML=\{\{\s*__html:\s*(.+?)\s*\}\}\s*\/>/g;

content = content.replace(pattern, (match, tag, before, field, placeholder, after, value) => {
    // combine before and after into props
    const otherProps = (before + ' ' + after).trim();
    // remove trailing slashes if any
    
    return `<InlineRichText tagName="${tag}" field={${field}} placeholder={${placeholder || "undefined"}} value={${value}} ec={ec} ${otherProps} />`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced successfully');
