 
function update_view(_movie){
	
	var movie = new Movie(_movie);
	jQuery('#lblTitle').text(movie.title);
	jQuery('#imgBack').attr({src: AppConfig._Base_Img_URL+movie.backdrop_path});
	jQuery('#imgPoster').attr({src: AppConfig._Base_Img_URL+movie.poster_path});
	jQuery('#spGenres').text(movie.getGenres());
	jQuery('#spDate').text(movie.release_date);
	jQuery('#dvDesc').text(movie.overview);
	jQuery('#spPop').text(movie.vote_average);

}

(function() {

	jQuery('#btnOk').click(function(){
		window.history.back();		
	});
	
	var sMovieJson = window.localStorage.getItem( 'movie_data' );	
	var movie = JSON.parse(sMovieJson);
	window.localStorage.removeItem( 'movie_data' );
	update_view(movie);
	
}());
	
	


