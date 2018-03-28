var AppConfig = {
	_API_Key : 'b81460ee5cf8f35188e4397dedc713de',
	_appId : null,
    _MovieDBServiceId : 'bMidoMSaxP.moviedbservice',
    _ServicePortName : 'SERVICE_PORT',
    _LocalMessagePortName : 'REPLY_PORT',    
    _Base_API_URL : 'https://api.themoviedb.org/3/%s?language=en-US&api_key=',
    _Base_Img_URL: 'https://image.tmdb.org/t/p/w370_and_h556_bestv2'
};
AppConfig._Base_API_URL = AppConfig._Base_API_URL + AppConfig._API_Key;