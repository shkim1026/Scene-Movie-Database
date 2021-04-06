$(document).ready(() => {
    let searchText = sessionStorage.getItem('searchText');
    if ($(".firstDiv").length) {
        request('https://api.themoviedb.org/3/movie/now_playing?api_key=68f3870916adfbbd1dbced0d703b6de4&language=en-US', 'np', 'nowPlaying', 'nowPlayingSlide');
        request('https://api.themoviedb.org/3/trending/tv/day?api_key=68f3870916adfbbd1dbced0d703b6de4', 'trTV', 'trendingTV', 'trendingTvSlide');
        request('https://api.themoviedb.org/3/movie/upcoming?api_key=68f3870916adfbbd1dbced0d703b6de4&language=en-US', 'up', 'upcoming', 'upcomingSlide');
        request('https://api.themoviedb.org/3/trending/movie/day?api_key=68f3870916adfbbd1dbced0d703b6de4', 'trM', 'trendingMovies', 'trendingMovieSlide');
        console.log('request complete')
    } else {
        console.log('searchText', searchText)
        search(searchText);
    }
    $('#searchForm').on('submit', (e) => {
        console.log('search form submitted');
        let value = $('#searchText').val();
        sessionStorage.setItem('searchText', value);
        window.location.href='/movie.html';
        e.preventDefault();
        return false;
    });
    // Places '#searchForm' in the proper location on the DOM according to width of window 
    if (window.screen.width < 1200) {
        $("#hamburgerLinks").prepend($("#searchForm"));
    } else {
        $(".mainHeader > a:nth-child(1)").after($("#searchForm"));
    }
 });

/////////////////////////////
//// SEARCH (MOVIE.HTML) ////
/////////////////////////////
function search(searchText) {
    console.log('searched')
    axios.get(`https://api.themoviedb.org/3/search/multi?api_key=68f3870916adfbbd1dbced0d703b6de4&language=en-US&query=${searchText}&page=1&include_adult=false`)
        .then((response) => {
            console.log('response', response);
            let results = response.data.results;
            console.log('results', results);
            let output = '';

            $.each(results, (index, item) => {
                let name = `${item.title}`;
                if (name === 'undefined') {
                    name = `${item.name}`;
                }
                let posterLink = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                let posterId = `${item.poster_path}`;
                if (posterId === 'undefined' || posterId === 'null') { 
                    posterLink = "https://intersections.humanities.ufl.edu/wp-content/uploads/2020/07/112815904-stock-vector-no-image-available-icon-flat-vector-illustration-1.jpg";
                }
                ////Replaces single quotes with "%27" to allow proper query in function "openModal()"
                item.title = item.title ? item.title.replace(/'/g, "%27") : '';
                item.name = item.name ? item.name.replace(/'/g, "%27") : '';
                ////
                output += `
                    <div class="searchedMovieDiv">
                        <div class="well text-center">
                            <a href="#" class="searchedMoviePoster" onclick='movieSelected(${item.id}, "${item.media_type}", "${item.title}", "${item.name}", "${item.release_date}", "${item.poster_path}")' class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#infoModal" href="#">
                                <img class="image" src="${posterLink}" alt="${item.title}">
                            </a>
                            <h4 class="titleP">${name}</h4>
                        </div>
                    </div>
                ` 
            });
            $('.displayDiv').html(output);
            console.log('search displayed');
        })
        .catch((err) => {
            console.log(err);
        })
}

///////////////////////////////
//// REQUEST (INDEX.HTML) /////
///////////////////////////////
function request(url, displayID, containerID, listID){
    axios.get(url)
       .then((response) => {
            console.log(response);
            let resp = response.data.results;
            let output = '';
            let display = '';
            let container = `
                    <div class=" movieContainer splide" id="${containerID}">
                        <div class="splide__track">
                            <div id="${listID}" class="splide__list"></div>     
                        </div>
                    </div>
            `;
           $.each(resp, (index, movie) => {
                ////Ensures proper titles populate on DOM (Movies = "title" / TV shows = "name")
                let title = movie.title; 
                if (title === undefined) {
                   title = movie.name;
                }
                let year = movie.release_date;
                if (year == undefined) {
                    year = movie.first_air_date;
                }
                ////
                output +=`
                        <div class="splide__slide">
                            <div class="splide__slide__container">
                                <a class="movieLink" onclick='movieSelected(${movie.id}, "${movie.media_type}", "${movie.title}", "${movie.name}", "${year}", "${movie.poster_path}")' data-bs-toggle="modal" data-bs-target="#infoModal" href="#">
                                    <img class="image" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${title}">
                                </a>
                            </div>
                        </div>
                `;
                display += output;
                output = '';
           });
           console.log('request displayed')
           
           $(`#${displayID}`).html(container); //Creates container
           $(`#${listID}`).html(display); //Displays movies onto DOM

            createSlide(`#${containerID}`); //Invokes function to create Slide   
       })
       .catch((err) => {
           console.log(err);
       }) 
}

//////////////////////////
//// SESSION STORAGE /////
//////////////////////////
//Stores movie or show information to localStorage after onclick
function movieSelected(id, media, title, name, year, poster) {
    console.log('clicked', id, media, title, name, year, poster);
    let yearOnly = year.slice(0, -6); //Removes the month and day of release date
    sessionStorage.setItem('imdbID', id);
    sessionStorage.setItem('mediaType', media);
    sessionStorage.setItem('title', title);
    sessionStorage.setItem('name', name); //<~ 'name' is the 'title' for TV shows
    sessionStorage.setItem('year', yearOnly);
    sessionStorage.setItem('poster', poster);
    console.log(`id:${id} | media:${media} | name:${name} | title:${title} | year:${yearOnly} | poster:${poster}`);
    openModal();
}


////Clears sessionStorage when modal is hidden
$('#infoModal').on('hidden.bs.modal', function () {
    sessionStorage.clear();
    $('.infoRow').remove();
  })


//////////////////////////
//// MODAL ///////////////
//////////////////////////
function openModal() {
    let movieID = sessionStorage.getItem('imdbID');
    let mediaType = sessionStorage.getItem('mediaType');
    let year = sessionStorage.getItem('year');
    let poster = sessionStorage.getItem('poster');  
    let tmdb = `https://api.themoviedb.org/3/movie/${movieID}?api_key=68f3870916adfbbd1dbced0d703b6de4`;
    let tmdbTV = `https://api.themoviedb.org/3/tv/${movieID}?api_key=68f3870916adfbbd1dbced0d703b6de4`;

    ////If no poster is available: use 'No Image Available' img
    let posterLink = `https://image.tmdb.org/t/p/w500${poster}`;
    let posterId = poster;
    if (posterId === 'undefined' || posterId === 'null') { 
        posterLink = "https://intersections.humanities.ufl.edu/wp-content/uploads/2020/07/112815904-stock-vector-no-image-available-icon-flat-vector-illustration-1.jpg";
    }
    ////
    
    if (mediaType === 'undefined' || mediaType === 'movie') {    //If selected item is a MOVIE...
        console.log('mediatype', mediaType);

        ////Readys Title in sessionStorage for query
        let title = sessionStorage.getItem('title');
        console.log('title', title);
        let andTitle = title.replace(/&/g, "and"); //Replaces "&" with "and"
        console.log('andTitle', andTitle);
        let singleQ = andTitle.replace(/'/g, "%27"); //Replaces "'" with "%27" for query
        console.log('singleQ', singleQ);
        let colon = singleQ.replace(/:/g, "%3A"); //Replaces ":" with  "%3A" for query
        console.log('colon', colon);
        let space = colon.split(' ').join('+'); //Replaces " " with "+"
        let queryTitle = space;
        if (!queryTitle.includes("%27") && !queryTitle.includes("%3A")) {
            queryTitle = queryTitle.replace(/%/g, "%25"); //Ensures usage of "%" in query
        }
        console.log('queryTitle', queryTitle);
        ////

        let omdb = `https://www.omdbapi.com/?t=${queryTitle}&y=${year}&apikey=dbbc79ec`;
        let requestOne = axios.get(omdb);
        let requestTwo = axios.get(tmdb);


        axios.all([requestOne, requestTwo])
            .then(axios.spread((...responses) => {
                console.log('responses', responses)
                const omdbResponse = responses[0];
                const tmdbResponse = responses[1];
                console.log(omdbResponse);
                console.log(tmdbResponse);
                let omdbMovie = omdbResponse.data;
                let tmdbMovie = tmdbResponse.data;
                let info;
                
                if (omdbMovie.Response === "False") {
                    console.log('Not found in OMDB database', omdbMovie.Response);
                    info = `
                    <div class="modal-content infoRow">
                        
                            <button type="button" class="close" data-bs-dismiss="modal">&times;</button>
                        
                        <div class="modal-body row" onblur="clearStorage()">
                            <div class="posterDiv col-md-5">
                                <img class="infoPoster" src="${posterLink}">
                            </div>
                            <div class="infoDiv col-md-6">
                                <h4 class="modal-title" id="modalLabel">${tmdbMovie.title}
                                </h4>
                                <p class="bundle"><strong>Rated: </strong>N/A</p>
                                <p class="bundle"><strong>Runtime: </strong>${tmdbMovie.runtime} min.</p>
                                <p><strong>${tmdbMovie.status}</strong>:
                                    <span>${tmdbMovie.release_date}</span>
                                </p>
                                <p class="bundle"><strong>Director: </strong>N/A</p>
                                <p class="bundle"><strong>Writers: </strong>N/A</p>
                                <p class="borderBot"><strong>Stars: </strong>N/A</p>

                                <h5 class="tagline">"${tmdbMovie.tagline}"</h5>
                                <p class="plot borderBot">${tmdbMovie.overview}</p>

                                <p><strong>Genre: </strong> N/A</p>
                                <p class=bundle><strong>IMDB Rating: </strong> ${tmdbMovie.vote_average}</p>
                                <p><strong>IMDB Votes: </strong> ${tmdbMovie.vote_count}</p>
                            </div>
                        </div>
                    </div>
                    `
                } else {
                    info = `
                    <div class="modal-content infoRow">
                        
                            <button type="button" class="close" data-bs-dismiss="modal">&times;</button>
                        
                        <div class="modal-body row">
                            <div class="posterDiv col-md-5">
                                <img class="infoPoster" src="${posterLink}">
                            </div>
                            <div class="infoDiv col-md-6">
                                <h4 class="modal-title" id="modalLabel">${omdbMovie.Title}</h4>
                                <p class="bundle"><strong>Rated: </strong>${omdbMovie.Rated}
                                </p>
                                <p class="bundle"><strong>Runtime: </strong>${omdbMovie.Runtime}</p>
                                <p><strong>${tmdbMovie.status}</strong>:
                                    <span>${omdbMovie.Released}</span>
                                </p>
                                <p class="bundle"><strong>Director: </strong>${omdbMovie.Director}</p>
                                <p class="bundle"><strong>Writers: </strong> ${omdbMovie.Writer}</p>
                                <p class="borderBot"><strong>Stars: </strong>${omdbMovie.Actors}</p>

                                <h5 class="tagline">"${tmdbMovie.tagline}"</h5>
                                <p class="plot borderBot">${omdbMovie.Plot}</p>

                                <p><strong>Genre: </strong> ${omdbMovie.Genre}</p>
                                <p class="bundle"><strong>IMDB Rating: </strong> ${omdbMovie.imdbRating}</p>
                                <p><strong>IMDB Votes: </strong> ${omdbMovie.imdbVotes}</p>
                            </div>
                        </div>
                    </div>
                    
                ` 
                }
                console.log("retrieved movie info");
                $('.movieModal').html(info);
                console.log("modal");
                if (tmdbMovie.tagline === "") {
                    $(".tagline").css("display", "none");
                }
                if (tmdbMovie.status !== "Released") {
                    tmdbMovie.status = "Coming Soon";
                }
            })).catch(errors => {
                console.log(errors);
            });
    } else {        //Else the selected item is a TV SHOW
        console.log('tv');

        let name = sessionStorage.getItem('name');
        console.log('name', name);
        let andName = name.replace(/&/g, "and"); //Replaces "&" with "and"
        console.log('andName', andName);
        let singleQ = andName.replace(/'/g, "%27"); //Replaces "'" with "%27" for query
        console.log('singleQ', singleQ);
        let colon = singleQ.replace(/:/g, "%3A"); //Replaces ":" with  "%3A" for query
        console.log('colon', colon);
        let space = colon.split(' ').join('+'); //Replaces " " with "+"
        let queryName = space;
        if (!queryName.includes("%27") && !queryName.includes("%3A")) {
            queryName = queryName.replace(/%/g, "%25"); //Ensures usage of "%" in query
        }
        console.log('queryName', queryName);

        let omdb = `https://www.omdbapi.com/?t=${queryName}&y=${year}&apikey=dbbc79ec`;
        let requestOne = axios.get(omdb);
        let requestThree = axios.get(tmdbTV);
        
        axios.all([requestOne, requestThree])
            .then(axios.spread((...responses) => {
                const omdbResponse = responses[0];
                const tmdbResponse = responses[1];
                console.log(omdbResponse);
                console.log(tmdbResponse);
                let omdbTV = omdbResponse.data;
                let tmdbTV = tmdbResponse.data;
                let tagline = tmdbTV.tagline;
                console.log("tagline", tagline);
                if (tmdbTV.last_air_date === null) {
                    tmdbTV.last_air_date = "N/A"; //Replaces Last Air Date to "N/A" when "null"
                    console.log("air date", tmdbTV.last_air_date);
                }
                
                let info = `
                    <div class="modal-content infoRow">
                        
                        <button type="button" class="close" data-bs-dismiss="modal">&times;</button>
                        
                        <div class="modal-body row">
                            <div class="posterDiv col-md-5">
                                <img class="infoPoster" src="${posterLink}">
                            </div>
                            <div class="infoDiv col-md-6">
                                <h4 class="modal-title" id="modalLabel">${omdbTV.Title}</h4>
                                <p><strong>Rated: </strong>${omdbTV.Rated}</p>
                                
                                <p class="bundle"><strong>Director: </strong>${omdbTV.Director}</p>
                                <p class="bundle"><strong>Writers: </strong>${omdbTV.Writer}</p>
                                <p><strong>Stars: </strong>${omdbTV.Actors}</p>

                                <p class="bundle"><strong>Seasons: </strong>${tmdbTV.number_of_seasons}</p>
                                <p class="bundle"><strong>Episodes: </strong>${tmdbTV.number_of_episodes}</p>
                                <p><strong>Runtime: </strong>${omdbTV.Runtime}</p>
                                
                                <p class="bundle"><strong>First Air Date: </strong>${tmdbTV.first_air_date}</p>
                                <p class="borderBot"><strong>Last Air Date: </strong>${tmdbTV.last_air_date} <i>(${tmdbTV.status})</i></p>

                                <h5 class="tagline">"${tmdbTV.tagline}"</h5>
                                <p class="plot borderBot">${tmdbTV.overview}</p>

                                <p><strong>Genre: </strong> ${omdbTV.Genre}</p>
                                <p class="bundle"><strong>IMDB Rating: </strong> ${omdbTV.imdbRating}</p>
                                <p><strong>IMDB Votes: </strong> ${omdbTV.imdbVotes}</p>
                            </div>
                        </div>
                    </div>
                    
                `
                console.log("retrieved TV info");
                $('.movieModal').html(info);
                console.log("modal");
                if (tagline === "") {
                    $(".tagline").css("display", "none");
                }
        })).catch(errors => {
            console.log(errors);
        });
    }  
}

//////////////////////////
//// SLIDER //////////////
//////////////////////////
function createSlide(slideDiv) {
    console.log('added slider')
    new Splide( slideDiv, {
        rewind      : true,
        padding     : {
            right   : '5rem',
            left    : '5rem',
        },
        perPage     : 12,
        pagination  : false,
        breakpoints : {
            576: {
                perPage: 1,
                arrows: false,
            },
            768: {
                perPage: 3,
                arrows: false,
            },
            992: {
                perPage: 4,
                arrows: false,
            },
            1024: {
                perPage: 5,
            },
            1920: {
                perPage: 8,
            },
        }
    }).mount();
}

//////////////////////////
//// HAMBURGER NAV ///////
//////////////////////////
function toggleHamburger() {
    if ($("#hamburgerLinks").css("display") == "grid") {
        $("#hamburgerLinks").css("display", "none");
        $("#searchText").css("display", "none");
        
    } else {
        $("#hamburgerLinks").css("display", "grid");
        $("#searchText").css("display", "grid");
        
    }
}

function hideLinks() {
    $("#hamburgerLinks").css("display", "none");
}
    

 // https://api.themoviedb.org/3/movie/527774?api_key=68f3870916adfbbd1dbced0d703b6de4

 // api key: 68f3870916adfbbd1dbced0d703b6de4

 // backdrop: hJuDvwzS0SPlsE6MNFOpznQltDZ.jpg

 // https://api.themoviedb.org/3/trending/all/day?api_key=68f3870916adfbbd1dbced0d703b6de4

 // https://api.themoviedb.org/3/configuration?api_key=68f3870916adfbbd1dbced0d703b6de4