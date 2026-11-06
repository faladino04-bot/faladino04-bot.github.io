const { data: { session } } = await db.auth.getSession();
if (!session) window.location.href = "../index.html";
document.getElementById("logo").addEventListener("click", ()=>{
    document.getElementById("menu_lado").classList.toggle("oculto")
})