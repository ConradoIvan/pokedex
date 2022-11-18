let pokemon_cached = new Map(); //mapa en el cual se almacenan los pokemon que se obtienen de la API
let offset = 0; //variable global que almacena la posicion actual en la grid de pokemon
let limite = 24; //catidad de pokemon solicitados en cada paginacion
let url_paginacion = `https://pokeapi.co/api/v2/pokemon`; //url de la pokeAPI a la cual se le realizan las peticiones

/**
 * Funcion que realiza la peticion de la paginacion al cargar el sitio
 */
$(document).ready(function(){
    solicitarPaginacion();
    offset+=limite;
});

/**
 * Funcion que solicita una paginacion de necesitarse pokemon que no se encuentren almacenados
 */
function solicitarPaginacion(){
    loading(true);
    fetch(url_paginacion+`?offset=${offset}&limit=${limite}`)
    .then((response) => response.json())
    .then((data) => procesarPaginacion(data));
    setTimeout(2000)
    loading(false);
}

/**
 * Funcion que permite procesar la respuesta de paginacion
 * ejecuta cada una de las peticiones que retorna la peticion de paginación
 * @param {*} respuesta 
 */
function procesarPaginacion(respuesta) {
    url_paginacion = respuesta.next;
    respuesta.results.forEach(registro => {
        if(registro.url!=null){
            response = solicitarPokemon(registro.url)
            if(!response){
                return false;
            } 
        }
    });
}

/**
 * Funcion asincrona que realiza la peticion a la API de un pokemon
 * @param {} url url de la peticion para la pokeAPI
 */
async function solicitarPokemon(url){
    
    const fetchPromise  = await fetch(url)
    const json = await fetchPromise.json();
    procesarPokemon(json)

    //desarrollo en proceso 
    /* try {
        fetch(url).then((response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Something went wrong');
        }).then((json) => {
            procesarPokemon(json);
        }).catch((error) => {
            console.log(error)
        });
    } catch (error) {
        console.log(error)
    } */
}

/**
 * Funcion que permite procesar un pokemon al ser recibido desde la solicitud fetch
 * @param {*} pokemon procesa el pokemon recibido desde la API
 */
function procesarPokemon(pokemon){
    pokemon_cached.set(pokemon.id,pokemon);
    mostrarPokemon(pokemon);
}

/**
 * Funcion que crea y hace append de una card en el div de pokemon
 * @param {*} pokemon json recibido por parte de la api
 */
function mostrarPokemon(pokemon) {
    //creamos los badges con los tipos del pokemon
    let badges_tipos = ``;
    pokemon.types.forEach((element)=>{
        let tipo = element.type.name;
        badges_tipos += `<span class="badge badge-${tipo} ml-1">${traducirTipo(tipo)}</span>`
    })

    //validamos si el pokemon cuenta con un sprite frontal
    let imagen_mostrar = (pokemon.sprites.front_default) ? pokemon.sprites.front_default : "assets/default.png"
    //creamos el elemento card y le acemos append en el div de los cards
    $("#divPokemon").append(`<div class="card cardPokemon" id_pokemon="${pokemon.id}">
            <img class="card-img-top imagen_pokemon" src="${imagen_mostrar}">
            <div class="card-body bodyCardPokemon">
                <h5 class="card-title">#${pokemon.id.toString().padStart(3,'0')} ${pokemon.species.name.charAt(0).toUpperCase()+pokemon.species.name.slice(1).toLowerCase()}</h5>
                ${badges_tipos}
                <p class="card-text ">
                    <b>Altura: ${pokemon.height/10} m</b>
                    <b>Peso: ${pokemon.weight/10} kg</b>
                    <b>Experiencia base: ${pokemon.base_experience}</b>
                </p>
            </div>
        </div>`);
}

// listener para los botones de la paginación del grid de pokemon
$(document).on("click",".btn-paginacion",function(){
    let inicio; //primera posicion a mostra de la grid
    let fin; //ultima posicion a mostra de la grid
    if($(this).attr("accion")=="retroceder"){
        //al retroceeder retrocedemos el offset 2 veces el limite y el inicio se vuelve el offset menos el limite
        inicio = offset-2*limite+1;
        fin = offset-limite;
    }else{
        //al avanzar incrementamos el offset en 1 y el offset se incrementa una vez el limite
        inicio = offset+1;
        fin = offset+limite;
    }
    
    //validamos que el inicio sea mayor a 0 al no existir pokemon con id del 0 hacia atraz
    if(inicio>0){

        //de ser una posicion valida modificamos el offset
        if($(this).attr("accion")=="retroceder")
            offset-=limite;
        else
            offset+=limite;

        //limpiamos el div principal, debe hacer una manera de mostrar los cards y modificarlos pero por facilidad se programo de esta manera
        $("#divPokemon").html("");
        //verificamos si tenemos los pokemon solicitados en memoria
        if(pokemon_cached.get(inicio)&&pokemon_cached.get(fin)){
            //mostramos los pokemon solicitados
            for (let i = inicio; i <= fin; i++) {
                mostrarPokemon(pokemon_cached.get(i));
            }
        }else{
            //de no ser así solicitamos a la api los pokemon faltantes
            loading(true);
            solicitarPaginacion();
            loading(false);
        }
    }

    
});

// listener para mostrar los stats del pokemon en el card
$(document).on("click",".cardPokemon",function(){
    let pokemon = pokemon_cached.get(Number($(this).attr('id_pokemon')));
    //validación para asegurarnos que el pokemon se encuentra en nuestro mapa
    if(pokemon){
        //mostramos la info del pokemon selecionado
        $("#titulo_modal_stats").html(pokemon.species.name.charAt(0).toUpperCase()+pokemon.species.name.slice(1).toLowerCase());
        total = 0;
        pokemon.stats.forEach((elemento)=>{
            nombre = elemento.stat.name;
            valor = elemento.base_stat;
            total += valor;
            porcentaje = Math.round(valor/255*100);
            console.log(porcentaje);
            $(`.valor_stat[atributo='${nombre}']`).html(valor);
            $(`.barra_stat[atributo='${nombre}']`).css("width",porcentaje+"%");
        });
        $("#total_stats").html(total);
        $("#modal_stats_pokemon").modal('show');
    }
});

//función que permite mostrar la animacion de carga
function loading(estado){
	if(estado){
		$("#body").LoadingOverlay("show", {
            image: "assets/loading.gif",
            imageAnimation: ""
        });
	}else{
		$("#body").LoadingOverlay("hide");
	}
}

// Función que permite traducir los tipos, puede ser remplazada por un enum
function traducirTipo(tipo){
    switch (tipo) {
        case "bug":
            return "Bicho";
        case "dark":
            return "siniestro";
        case "dragon":
            return "dragón";
        case "electric":
            return "electrico";
        case "fairy":
            return "hada";
        case "fighting":
            return "lucha";
        case "fire":
            return "fuego";
        case "flying":
            return "volador";
        case "ghost":
            return "fantasma";
        case "grass":
            return "planta";
        case "ground":
            return "tierra";
        case "ice":
            return "hielo";
        case "normal":
            return "normal";
        case "posion":
            return "veneno";
        case "phychic":
            return "psiquico";
        case "rock":
            return "roca";
        case "steel":
            return "acero";
        case "water":
            return "agua";
        case "poison":
            return "veneno";
        default:
            return "";
    }
}