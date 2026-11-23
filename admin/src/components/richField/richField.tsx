import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.bubble.css'
import styled from 'styled-components'

// Quill "bubble" editor dressed as a plain input: select text to format it.

const Field = styled.div.attrs({
    className : `rich-field w-full rounded-md` as string
})<{minHeight : number, invalid? : boolean}>`
    background : ${({theme}) => theme.color.surface};
    border : ${({theme, invalid}) => `1px solid ${invalid ? theme.color.tag.red : theme.color.lineStrong}`};
    transition : border-color 150ms ease, box-shadow 150ms ease;
    &:focus-within {
        border-color : ${({theme}) => theme.color.accent};
        box-shadow : 0 0 0 3px ${({theme}) => theme.color.ring};
    }
    .ql-editor { min-height : ${({minHeight}) => minHeight}px; }
`

const modules = {
    toolbar : [
        ['bold', 'italic', 'underline', 'strike'],
        [{ script : 'sub' }, { script : 'super' }],
        ['code', 'link', 'image'],
        ['clean'],
    ],
}

const formats = ['bold', 'italic', 'underline', 'strike', 'script', 'code', 'link', 'image']

interface RichFieldProps {
    value : string
    onChange : (value : string) => void
    placeholder? : string
    minHeight? : number
    invalid? : boolean
    label? : string
}

// Quill reports an "empty" editor as <p><br></p>
export const isBlank = (html : string) => html.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !html.includes('<img')

const RichField = ({ value, onChange, placeholder, minHeight = 44, invalid, label } : RichFieldProps) => (
    <Field minHeight={minHeight} invalid={invalid} aria-label={label}>
        <ReactQuill
            theme="bubble"
            value={value}
            onChange={(next) => onChange(isBlank(next) ? '' : next)}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
        />
    </Field>
)

export default RichField
