import { LANGUAGES } from '../utils/languages'

function LanguageToggle({ currentLang, onLanguageChange }) {
  return (
    <div style={{
      display:  'flex',
      gap:      '4px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <span style={{
        fontSize: '11px',
        color:    '#475569',
        marginRight: '4px'
      }}>
        🌍
      </span>
      {Object.values(LANGUAGES).map(lang => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          style={{
            fontSize:     '10px',
            fontWeight:   500,
            padding:      '3px 8px',
            borderRadius: '20px',
            border:       `1px solid ${
              currentLang === lang.code ? '#378ADD' : '#1e293b'
            }`,
            background:   currentLang === lang.code
              ? '#378ADD20' : 'transparent',
            color:        currentLang === lang.code
              ? '#378ADD' : '#475569',
            cursor:       'pointer',
            transition:   'all 0.15s'
          }}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  )
}

export default LanguageToggle