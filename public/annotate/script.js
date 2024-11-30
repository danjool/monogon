editRef = null, lastRef = null, refs = {}, lastOnScroll = 0
const colors = ["#92B", "#08D", "#087", "#582", "#980", "#B40", "#B10", "#643"]
const qs = (selector) => document.querySelector(selector)

window.onload = async function() {
  let urlParams = new URLSearchParams(window.location.search), workId = urlParams.get('work') ?? 'moby-dick', refId = urlParams.get('ref')

  let conEl = qs('.content') // holds the main text
  let minimap = qs('#minimap canvas') // replaces the scrollbar, shows the main text with ref links highlighted
  let viewportEl = document.getElementById('viewport') // like a window into the minimap, or the scrollbar pill replacement
  let refEl = qs('#ref-editor') // the annotation box, editable, color picker, and annotation text
  let colorPicker = qs('#palette') // holds the color options for the ref link
  let annEl = qs('#annotation') // holds the annotation text

  let { text } = await loadWork(workId)
  await renderText(text)
  if(refId) { 
    let refLink = document.getElementById(refId)
    if (refLink) openRef( refLink, { target: refLink }) 
  }

  colors.forEach((color) => {
    let colorDiv = document.createElement('div')
    colorDiv.className = 'color-option'
    colorDiv.style.backgroundColor = color
    colorDiv.addEventListener('click', async function() {
      if(editRef) refs[editRef].color = color
      refEl.style.backgroundColor = color
      await save()
    })
    colorPicker.appendChild(colorDiv)
  })

  async function renderText(rawText) {
    let text = Object.keys(refs).reduce((mainText, ref) => {
      let regex = new RegExp(ref, 'gm')
      return mainText.replace(regex, `<span class="ref-link" style="background-color: ${refs[ref].color};" id="${ref}">${ref}</span>`)
    }, rawText)
    
    let scrollY = window.scrollY
    conEl.innerHTML = text
    document.querySelectorAll('.ref-link').forEach(refLink => refLink.addEventListener('click', (e) => { openRef(refLink, e) })) 
    window.scrollTo(0, scrollY)
    drawMinimap(text)
  }

  async function drawMinimap(text) {
    let { width, height } = conEl.getBoundingClientRect()
    const scaleFactor = Math.min(1, (window.innerHeight) / height)
    const scaledWidth = Math.max(100, width * scaleFactor)
    const scaledHeight = height * scaleFactor
    minimap.width = scaledWidth
    minimap.height = scaledHeight
    const context = minimap.getContext('2d')
    const lines = text.split('\n')
    const lineHeight = (height) / lines.length
    const scaledLineHeight = lineHeight * scaleFactor
    const colorRegex = /style="background-color: (.*?);"/
    lines.forEach((line, index) => {
      const lineWidth = (line.split(' ').length/20.0) * scaledWidth
      const hasRef = line.includes('ref-link')
      let lineColor = 'rgba(255, 255, 255, 0.3)'
      if(hasRef) {
        const colorMatch = line.match(colorRegex)
        if(colorMatch && colorMatch[1]) {
          lineColor = colorMatch[1] // extracted color from the ref link
        } else {
          lineColor = 'rgba(255, 0, 255, 1.0)'
        }
      }
      context.fillStyle = lineColor
      context.fillRect(0, index * scaledLineHeight, lineWidth, scaledLineHeight + (hasRef ? .8 : .01) )
    })
  }

  async function openRef(refLink, e) {
    refEl.style.visibility = ( refLink === lastRef && refEl.style.visibility !== 'hidden') ? 'hidden' : 'visible'
    if (annEl) annEl.innerHTML = refs[refLink.id]?.annotation ?? ""
    refEl.style.backgroundColor = refs[refLink.id].color
    refEl.style.marginTop = ( e.pageY - 12 ) + 'px'
    lastRef = refLink
    editRef = refLink.id
  }

  const onScroll = () => {
    const t = Date.now() // debouncing
    if (t - lastOnScroll < 100) return
    const docHeight = document.body.scrollHeight
    const vpHeight = window.innerHeight
    const scrollMax = docHeight
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop
    const scrollPercent = scrollPos / scrollMax
    const top = scrollPercent * vpHeight
    viewportEl.style.height = `${(vpHeight / scrollMax) * 100}%`
    viewportEl.style.top = `${top}px`
    lastOnScroll = t
  }

  async function loadWork(id) {
    let response = await fetch(`works/${id}.txt`)
    let text = await response.text()
    let refData = await fetch(`works/${id}-refs.json`).catch(console.log)
    refs = refData && refData.status === 200 ? await refData.json() : {}
    return { text, refs }
  }
  async function save(){
    if(!editRef) return
    refs[editRef].annotation = annEl.innerHTML.replace(/<br>/g, '\n')
    if(['', ' ', '\n', '<br>'].includes(annEl.innerHTML) && refs[editRef]){
      delete refs[editRef]
      refEl.style.visibility = 'hidden'
    }
    const numberOfInstances = (text.match(new RegExp(editRef, 'gm')) || []).length
    if(numberOfInstances > 10) {
      delete refs[editRef]
      refEl.style.visibility = 'hidden'
    }
    const body = { refs, workId }
    fetch('/annotate/updateRefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(console.log).finally(() => { renderText(text), refEl.style.visibility = 'none' })
  }

  window.addEventListener('scroll', onScroll)
  function scrollViewport() {
    const clickPosition = event.offsetY
    const canvasHeight = minimap.height
    const documentHeight = document.body.scrollHeight
    const scrollPosition = (clickPosition / canvasHeight) * documentHeight
    window.scrollTo(0, scrollPosition)
  }
  minimap.addEventListener('click', () => {scrollViewport()})
  minimap.addEventListener('mousemove', (event) => {if(event.buttons === 1) scrollViewport()})
  conEl.addEventListener('mouseup', function(e) {
    let selection = window.getSelection().toString().trim().replace(/\r/g, '')
    navigator.clipboard.writeText(selection)
    if (selection) {
      refs[selection] = {
        "annotation": "", 
        "color": colors[Object.keys(refs).length % colors.length]
      },
      editRef = selection
      refEl.style.marginTop = ( e.pageY - 12 ) + 'px'
      annEl.innerHTML = "", refEl.style.visibility = 'visible', annEl.focus()
    }
  })
  refEl.addEventListener('keydown', async function(e) { if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    await save()
  }})

}