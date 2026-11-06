document.getElementById("enviar").addEventListener("click", ()=>{
    if (document.getElementById("rol").value == "estudiante"){
        window.location.href = "estudiantes/estudiante.html"
    }
    
})