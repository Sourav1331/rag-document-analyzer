import { Icon } from './Icon'

export default function ThemeToggle({ theme, onToggle }) {
  const label = 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme'
  return <button type="button" className="icon-button" onClick={onToggle} aria-label={label} title={label}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
}
