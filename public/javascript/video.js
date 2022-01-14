var tag = document.createElement('script')
tag.src = "https://www.youtube.com/iframe_api"
var firstScriptTag = document.getElementsByTagName('script')[0]

firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('videoContainer', {
    height: '390',
    width: '640',
    videoId: video_url.content,
    playerVars: {
      'playsinline': 1
    }
  })
}

var done = false

//We may use this only to display date for user. but we can store the orginal value in db
let convertSecToDate = (seconds) => {
  var date = new Date(0)
  date.setSeconds(seconds)
  return timeString = date.toISOString().split("T")[1].split(".")[0]
}

const socket = io({
  query: { "video": video_id.content }
})

const public_messages = []
const private_messages = []

if (document.getElementById("public_notes")) {
  public_notes.addEventListener("click", () => {
    update_chat()
  })
}

if (document.getElementById("private_notes")) {
  private_notes.addEventListener("click", () => {
    update_chat()
  })
}

if (document.getElementById("chat_form")) {
  chat_form.addEventListener("submit", e => {
    e.preventDefault()

    socket.emit("chat_message", {
      text: chat_txt.value,
      time: Math.round(player.getCurrentTime()),
      public: public_notes.checked
    })

    chat_txt.value = ""
  })
}

function update_chat() {
  while (chat_messages.firstChild) {
    chat_messages.removeChild(chat_messages.firstChild)
  }

  let messages = public_messages
  if (document.getElementById("private_notes") && private_notes.checked) {
    messages = private_messages
  }

  messages.sort((a, b) => {
    return a.time - b.time
  })

  messages.forEach(msg => {
    chat_messages.appendChild(msg.e)
  })
}

function create_message(msg) {
  const e = document.createElement("div")
  e.classList.toggle("chat_message", true)

  const time = document.createElement("span")
  time.classList.toggle("chat_time")
  e.appendChild(time)
  time.textContent = convertSecToDate(msg.time)
  time.addEventListener("click", () => {
    player.seekTo(msg.time)
  })

  const username = document.createElement("span")
  e.appendChild(username)
  username.textContent = msg.username + ":"

  const text = document.createElement("span")
  text.textContent = msg.text
  e.appendChild(text)

  return e
}

socket.on("messages", (public, private) => {
  public.forEach(msg => {
    const e = create_message(msg)
    msg.e = e
  })
  public_messages.push(...public)

  private.forEach(msg => {
    const e = create_message(msg)
    msg.e = e
  })
  private_messages.push(...private)

  update_chat()
})

// append the chat text message
socket.on('chat_message', function (msg) {
  const e = create_message(msg)
  msg.e = e
  if (msg.public) {
    public_messages.push(msg)
  } else {
    private_messages.push(msg)
  }
  update_chat()
})

if (document.getElementById("btnSubscribe")) {
  btnSubscribe.addEventListener("click", () => {
    if (btnSubscribe.textContent == "Subscribe") {
      socket.emit("subscribe", resp => {
        if (resp.success) {
          btnSubscribe.textContent = "Unsubscribe"
        }
      })
    } else {
      socket.emit("unsubscribe", resp => {
        if (resp.success) {
          btnSubscribe.textContent = "Subscribe"
        }
      })
    }
  })
}

if (document.getElementById("btnShare")) {
  const share_modal_outer = document.createElement("div")
  share_modal_outer.classList.toggle("share_modal_outer", true)

  const share_modal = document.createElement("div")
  share_modal_outer.appendChild(share_modal)
  share_modal.classList.toggle("share_modal", true)


  const share_modal_header = document.createElement("div")
  share_modal.appendChild(share_modal_header)
  share_modal_header.classList.toggle("share_modal_header", true)

  const share_modal_header_title = document.createElement("span")
  share_modal_header.appendChild(share_modal_header_title)
  share_modal_header_title.textContent = "Share"

  const share_modal_header_close = document.createElement("button")
  share_modal_header.appendChild(share_modal_header_close)
  share_modal_header_close.textContent = "close"
  share_modal_header_close.classList.toggle("modal_close", true)
  share_modal_header_close.classList.toggle("icon", true)

  share_modal_header_close.addEventListener("click", () => {
    share_modal_outer.parentElement.removeChild(share_modal_outer)
  })

  const share_modal_content = document.createElement("div")
  share_modal.appendChild(share_modal_content)
  share_modal_content.classList.toggle("share_modal_content", true)

  const txt_username = document.createElement("input")
  share_modal_content.appendChild(txt_username)

  const btn_share = document.createElement("button")
  share_modal_content.appendChild(btn_share)

  btn_share.textContent = "Share"
  btn_share.addEventListener("click", () => {
    socket.emit("share", txt_username.value, resp => {
      alert(resp)
    })
  })

  btnShare.addEventListener("click", () => {
    body.appendChild(share_modal_outer)
  })
}

socket.connect()
