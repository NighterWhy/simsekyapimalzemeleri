// EmailJS form gönderim kodu
(function () {
  emailjs.init("2LPInACVmsjayiX35"); // PUBLIC KEY

  const form = document.getElementById("quoteForm");
  const sendBtn = document.querySelector(".submit-btn");
  const sentMsg = document.querySelector(".sent-message");
  const errMsg = document.querySelector(".error-message");
  const loading = document.querySelector(".loading");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    sentMsg.style.display = "none";
    errMsg.style.display = "none";
    loading.style.display = "block";
    sendBtn.disabled = true;

    emailjs.sendForm("service_v50bpfi", "template_44fm3kp", form)
      .then(() => {
        loading.style.display = "none";
        sentMsg.style.display = "block";
        form.reset();
      })
      .catch((err) => {
        console.error(err);
        loading.style.display = "none";
        errMsg.style.display = "block";
      })
      .finally(() => {
        sendBtn.disabled = false;
      });
  });
})();
