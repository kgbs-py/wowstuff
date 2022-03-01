import React from 'react'

export default props => (
  <ul className='nav nav-tabs'>
    { props.tabs.map((tab, i) =>
      <li className='nav-item' key={i}>
        <a className={'nav-link ' + (tab.href === props.active ? 'active' : '')}
           href={`#${tab.href}`} onClick={() => props.onChange(tab.href)}
        >{tab.name}</a>
      </li>
    ) }
  </ul>
)
