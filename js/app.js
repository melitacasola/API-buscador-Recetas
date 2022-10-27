

function inicarApp(){

    const resultado = document.querySelector('#resultado');
    const selectCategorias = document.querySelector('#categorias');
    if(selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');
    if(favoritosDiv){
        obtenerFavoritos();
    }
    
    const modal = new bootstrap.Modal('#modal', {});
    

    function obtenerCategorias(){
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php'
        fetch(url)
            .then( respuesta => respuesta.json())
            .then( resultado => mostrarCateg(resultado.categories))
    }   

    function mostrarCateg (categorias = []) {
        categorias.forEach(categoria =>{

            const {strCategory} = categoria;
            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;

            selectCategorias.appendChild(option)
           
        })

    }

    function seleccionarCategoria(e){
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetas(resultado.meals))
        
    }

    function mostrarRecetas(recetas = []){

        limpiarHTML(resultado); //con selector

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados' : 'No Hay Resultados';
        resultado.appendChild(heading)

        //iterar en los resultados
        recetas.forEach(receta =>{
            const{idMeal, strMeal, strMealThumb} = receta;

            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100')
            recetaButton.textContent = 'Ver Receta';
            // recetaButton.dataset.bsTarget = '#modal';
            // recetaButton.dataset.bsToggle = 'modal';
            recetaButton.onclick = function(){
                seleccionarReceta(idMeal ?? receta.id);
            }
            
            // Renderizar en el HTML
            /*
            .card
                img
                .card-body
                    h3
                    button */

            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaContenedor.appendChild(recetaCard);

            //tiene qe haber un cod real en HTML donde inyectar el contenido
            resultado.appendChild(recetaContenedor);

        });

    };

    function seleccionarReceta(id){
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetaModal(resultado.meals[0]))
    };

    function mostrarRecetaModal(receta){

        const { idMeal,strInstructions, strMeal, strMealThumb} = receta;
        
        // Añadir contenido al Modal
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="${strMeal}" />
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades</h3>
        `;

        const listGroup = document.createElement('UL');

        listGroup.classList.add('list-group')
        //mostrar cantidades e ingredientes
        for(let i =1; i<= 20; i++){
            if(receta[`strIngredient${i}`]){
                const ingrediente= receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`
                
                listGroup.appendChild(ingredienteLi)
            };
        }

        modalBody.appendChild(listGroup);

        const modalFooter = document.querySelector('.modal-footer'); 
        limpiarHTML(modalFooter);

        //btns de Cerrar y Favorito
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Agregar a Favorito';

        const btnCerrar = document.createElement('BUTTON');
        btnCerrar.classList.add('btn', 'btn-secondary', 'col');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.onclick = function(){
            modal.hide();
        }

        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrar);

        //localStorage
        btnFavorito.onclick = function(){
            if(existeStorage(idMeal)){
                eliminarFavorito(idMeal)
                btnFavorito.textContent = 'Agregar a Favorito';
                mostrarToast('Eliminado de Favoritos correctamente')
                return
            }
            
            agregarFavorito({
                id:idMeal,
                titulo:strMeal, 
                img: strMealThumb
            })
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Se agregó a Favoritos')
        }

        //muestra el modal
        modal.show();
    }

    function agregarFavorito(receta){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? []
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
        
    };

    function eliminarFavorito(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    }
    //evitar elementos repeditos en Favoritos
    function existeStorage(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id);
    };

    function mostrarToast(mensaje){
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);

        toastBody.textContent = mensaje;

        toast.show();

    };

    function obtenerFavoritos(){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        if(favoritos.length){
            mostrarRecetas(favoritos);
            return

        }

        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay favoritos...';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');

        favoritosDiv.appendChild(noFavoritos)
    }

    function limpiarHTML(selector){
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
};

document.addEventListener('DOMContentLoaded', inicarApp);