const { ipcRenderer } = require('electron');


document.querySelector('#send-email-form')
  .addEventListener('submit', event => {
    event.preventDefault();
    dispatcher();
});


document.querySelector("#cancel")
  .addEventListener('click', () => {
    console.log('window-hide')
    ipcRenderer.send('window-hide', null);
});


function author() {
  ipcRenderer.send('open-author', null);
}


function project() {
  ipcRenderer.send('open-project', null);
}


function mailhog() {
  ipcRenderer.send('open-mailhog', null);
}


function dispatcher() {

  const name    =   document.querySelector("#name").value;
  const from    =   document.querySelector("#from").value;
  const to      =   document.querySelector("#to").value;
  const subject =   document.querySelector("#subject").value;
  const body    =   document.querySelector("#body-email").value;

  ipcRenderer.send('send-mail', {
    name,
    from,
    to,
    subject,
    body
  });

  ipcRenderer.on('mail-sended', event => {
    browserWindowNotifier('Email enviado com sucesso!')
  });

}


function browserWindowNotifier(msg) {
  let message = document.querySelector("#message");
  message.innerHTML = createMessage(msg)
  browserWindowNotify();
}


function createMessage(msg) {
  let message = 
  `<div class="toast-container position-fixed top-1 end-0 p-3" id="toast">
		<div class="toast text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
		  <div class="d-flex">
		    <div class="toast-body">${ msg }</div>
		    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
		  </div>
		</div>
	</div>`

  return message
}


function browserWindowNotify() {
  let toastElList = [].slice.call(document.querySelectorAll('.toast'))
  let toastList = toastElList.map(toastEl => {
    return new bootstrap.Toast(toastEl)
  });

  toastList.forEach(toast => toast.show());
}