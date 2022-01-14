video_add_tag.addEventListener("click", () => {
  if (video_tags.value.length == 0) {
    return
  }

  if (Array.from(video_tag_list.children).map(e => e.children[1].value)
    .includes(video_tags.value)) {
    return
  }

  const e = document.createElement("div")

  const text = document.createElement("span")
  text.textContent = video_tags.value
  e.appendChild(text)

  const inp = document.createElement("input")
  e.appendChild(inp)
  inp.type = "hidden"
  inp.name = "tags"
  inp.setAttribute("form", "main_form")
  inp.value = video_tags.value

  const btn_remove = document.createElement("button")
  e.appendChild(btn_remove)
  btn_remove.classList.toggle("icon")
  btn_remove.innerHTML = "close"
  btn_remove.addEventListener("click", () => {
    e.parentNode.removeChild(e)
  })

  video_tag_list.appendChild(e)

  video_tags.value = ""
})

form2.addEventListener("submit", e => {
  video_add_tag.click()
  e.preventDefault()
})
