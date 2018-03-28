/**********************************************************
 *	Genre Class 
 **********************************************************/
function Genre(id,name)
{
	this.id = id;
	this.name = name;
}


/**********************************************************
 *	GenreList Class 
 **********************************************************/

function GenreList(){
	this.genre_list = [];
}

GenreList.prototype.add = function(genre){
	if(genre){
		this.genre_list.push(genre);	
	}	
};

GenreList.prototype.clear = function(){
		this.genre_list = [];		
};


GenreList.prototype.getGenre = function(id){
		
	for(var i=0; i<this.genre_list.length;i++)
		{
		  if (this.genre_list[i].id === id){
			  return this.genre_list[i];
		  }
		}
	return null;
};

/**********************************************************
 *	MovieList Class 
 **********************************************************/

function MovieList(){
	this.movie_list = [];
	this.current_page = 1;
	this.total_pages = 1;
} 

MovieList.prototype.add = function(movie){
	if(movie){
		this.movie_list.push(movie);	
	}	
};

MovieList.prototype.clear = function(){
	this.movie_list = [];		
};

MovieList.prototype.findMovie = function(movieID){
	for(var i=0; i<this.movie_list.length;i++)
	{
	  if (this.movie_list[i].id === movieID){
		  return this.movie_list[i];
	  }
	}
    return null;
};

/**********************************************************
 *	Movie Class 
 **********************************************************/
function Movie(movieData)
{
	if(movieData)
	{
	this.id = movieData.id || -1; 
	this.title = movieData.title || '';
	this.vote_average = movieData.vote_average|| 0.0;
	this.poster_path = movieData.poster_path||'';
	this.original_language = movieData.original_language|| '';
	this.backdrop_path = movieData.backdrop_path|| '';
	this.genres = movieData.genres || []; 
	this.overview = movieData.overview|| '';
	this.release_date = movieData.release_date|| ''; 
	this.popularity = movieData.popularity|| 0.0;
	}
}

Movie.prototype.addGenre = function(genre){
	if(genre){
      this.genres.push(genre);
	}
};

Movie.prototype.getGenres = function(){
    var sGenres = '';
    var i = 0;
    if(this.genres){
    	for(i=0; i<this.genres.length;i++){
        	if(i>0){
        		sGenres = sGenres + ", ";
        	}
        	sGenres = sGenres + this.genres[i].name; 
        }	
    }
    
    return sGenres;
};