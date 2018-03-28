var self = null;
var sNowPlaying = '';
var sUpComing = '';
var sGenres = '';

//Service Controller : to communicate to the service
function MovieService(config,callback)
{
	self = this;
	this.LocalMessagePort = null;
	this.LocalMessagePortWatchId = null;
	this.RemoteMessagePort = null;
	this.LocalMessagePortName = config._LocalMessagePortName;
	this.ServicePortName = config._ServicePortName;
	this.appId = config._appId;
	this.seviceID = config._MovieDBServiceId;
	this.base_API_URL = config._Base_API_URL;	
	this.Genres = new GenreList();
	this.NowPlaying = new MovieList();
	this.Upcoming = new MovieList();	
	this.IsBusy = false;
	this.callback = callback;	
}

//Disconnect from service
MovieService.prototype.disConnectFromService = function (){
	
	if (self.RemoteMessagePort) {
		self.RemoteMessagePort = null;
    }
    if (self.LocalMessagePort) {
        try {
        	self.LocalMessagePort
                .removeMessagePortListener(self.LocalMessagePortWatchId);
        	self.LocalMessagePort = null;
        } catch (error) {
            console.error(error);
        }
    }
}

//Process movie data and add new list of movies to corresponding lists 
function process_movie_data(dataType,dataObject){
	
	var bNowPlaying =  dataType === "now_playing";//nowplaying OR upcoming movies?
	var i = 0;
	var j = 0;
	
	
	if(bNowPlaying){

		self.NowPlaying.current_page = dataObject.page;
		self.NowPlaying.total_pages = dataObject.total_pages;
		
		//update genres
		for(i=0; i<dataObject.results.length;i++){
			
			var movie = new Movie(dataObject.results[i]);
			for(j=0;j<dataObject.results[i].genre_ids.length;j++){
				
			   var genre_id = dataObject.results[i].genre_ids[j];
			   movie.addGenre(self.Genres.getGenre(genre_id));
			}		
			self.NowPlaying.add(movie);	
		}		
	}
	else//Update  Upcoming list
	{
		self.Upcoming.current_page = dataObject.page;
		self.Upcoming.total_pages = dataObject.total_pages;
		for(i=0; i<dataObject.results.length;i++){
			
			var movie = new Movie(dataObject.results[i]);
			for(j=0;j<dataObject.results[i].genre_ids;j++){
			   var genre_id = dataObject.results[i].genre_ids[j];
			   movie.addGenre(self.Genres.getGenre(genre_id));
			}
			self.Upcoming.add(movie);	
		}
	}
	
}


//Initialize message ports for communication
MovieService.prototype.initMessagePort = function  (){

    try {
    	//App message port to receive data from service
        self.LocalMessagePort = tizen.messageport
            .requestLocalMessagePort(self.LocalMessagePortName);
        self.LocalMessagePortWatchId = self.LocalMessagePort
            .addMessagePortListener(function onDataReceive(data, remote) {
                onReceive(data, remote);
            });
    } catch (e) {
    	self.LocalMessagePort = null;
        console.error(e.name);
    }

    try {
    	//Service port to send commands to the service
    	self.RemoteMessagePort = tizen.messageport
            .requestRemoteMessagePort(self.seviceID, self.ServicePortName);
    } catch (ex) {
    	self.RemoteMessagePort = null;
        console.error(ex.name);
    }    
    self.callback('event',{name:'service_ready'});     
};

//calls when data received from service
function onReceive(data) {
    'use strict';
    var i = 0,
        idx = 0,
        len = data.length;
    for (i = 0; i < len; i += 1) {
    	//Receiving Json string of Now Playing
        if (data[i].key === 'now_playing') {

        	if(data[i].value === 'error'){

        		self.callback('error',{msg:'Error communicating to the server!',btn:'Try Again',overlay:true,cb:function(){ self.sendCommand('now_playing',null); }});
        		
         	}else if(data[i].value === 'start'){
        	   //start Receiving Json String
        	  sNowPlaying = '';	        	  
        	}
        	else if(data[i].value === 'finish'){
        		//complete Json string received  

        		var jsonObject = null;
        		try
        		{
        		  jsonObject = JSON.parse(sNowPlaying);
        		}
        		catch(ex){
        			self.callback('error',{msg:'Error communicating to the server!',btn:'Try Again',overlay:true,cb:function(){ self.sendCommand('now_playing',null); }});
        			return;
        		}
        		
        		var idStart = self.NowPlaying.movie_list.length;
        		process_movie_data(data[i].key,jsonObject);
        		        		
                sNowPlaying = '';
                self.callback('event',{name:'now_playing_received',id:idStart});
        	}
        	else{
        		//Concat next chunk of json string received
        		sNowPlaying = sNowPlaying.concat(data[i].value);
        	}
        	           
        }
        else if (data[i].key === 'upcoming_movies') { //Receiving Json string of Upcoming Movies
        	
        	if(data[i].value === 'error'){

        		self.callback('error',{msg:'Error communicating to the server!',btn:'Try Again',overlay:true,cb:function(){ self.sendCommand('upcoming_movies',null); }});
        		
         	}else if(data[i].value === 'start'){
            	   //start Receiving Json String
            		sUpComing = '';	        	  
            	}
            	else if(data[i].value === 'finish'){
            		
            		//complete Json string received        		        		                        	
            		var jsonObject = null;
            		try
            		{
            			jsonObject = JSON.parse(sUpComing);
            		}catch(ex){
            			self.callback('error',{msg:'Error communicating to the server!',btn:'Try Again',overlay:true,cb:function(){ self.sendCommand('upcoming_movies',null); }});
            			return;
            		}
            		
            		var idStart = self.Upcoming.movie_list.length;
            		process_movie_data(data[i].key,jsonObject);
            		            		  		        	
                    sUpComing = '';
                    self.callback('event',{name:'upcoming_movies_received',id:idStart});
            	}
            	else{
            		//Concat next chunk of json string received
            		sUpComing = sUpComing.concat(data[i].value);
            	}
            	           
            }
        else if (data[i].key === 'genres') { //Receiving Json string of Upcoming Movies
        	
        	if(data[i].value === 'error'){

        		self.callback('error',{msg:'Error communicating to the server!',btn:'Try Again',overlay:true,cb:function(){ self.sendCommand('genres',null); }});
        		
         	}else  if(data[i].value === 'start'){
        	   //start Receiving Json String
        		sGenres = '';	
        		self.Genres.clear();
        	}
        	else if(data[i].value === 'finish'){
        		//complete Json string received 
        		var jsonObject = null;
        		try
        		{
        		 jsonObject = JSON.parse(sGenres);
        		}catch(ex){
        			self.callback('error',{msg:'Error communicating to the server!',btn:'Try Again',overlay:true,cb:function(){ self.sendCommand('genres',null); }});
        			return;
        		}
        		for(idx=0; idx<jsonObject.genres.length; idx+=1){
        			self.Genres.add( new Genre(jsonObject.genres[idx].id , jsonObject.genres[idx].name ));
        		}
        		
        		sGenres = '';
        		self.callback('event',{name:'generes_received'});
        	}
        	else{
        		//Concat next chunk of json string received
        		sGenres = sGenres.concat(data[i].value);
        	}
        	           
        }
        
    }
    self.IsBusy = false;
    self.callback('status',self.IsBusy);
}


//Send command to service
MovieService.prototype.sendCommand = function(commandName,commandValue){

try {
	self.IsBusy = true;
	self.callback('status',self.IsBusy);	
	if(commandValue == null || commandValue == undefined)
		{
		  commandValue = null;
		}
	this.RemoteMessagePort.sendMessage( [{key: "command", value: commandName},
	                                     {key: "data", value: commandValue}],
			this.LocalMessagePort);
                        
} catch (error) {
	self.IsBusy = false;
	self.callback('status',self.IsBusy);
    console.error(error.name);
    self.callback('error',{msg:'Service command error!\r\n'+err.message,btn:'Try Again',cb:function(){ self.sendCommand(commandName,commandValue); }});
}

};

//Launch the service
MovieService.prototype.startService = function(){
	
	function onSuccess() {
		//Init ports once service started successfully
		self.initMessagePort();	
    }

    function onError(err) {

    	self.callback('error',{msg:'Launching service failed!\r\n'+err.message,btn:'Try Again',cb:function(){ self.startService(); }});
    }

    
    try {

    	//Data to be passed to the service for unidirectional communication between app and service
    	var appPortname = new tizen.ApplicationControlData("appPortname", [this.LocalMessagePortName]);
    	var servicePortName = new tizen.ApplicationControlData("servicePortName", [this.ServicePortName]);    	 
    	var appID = new tizen.ApplicationControlData("appID", [this.appId]);
    	var base_API_URL = new tizen.ApplicationControlData("base_API_URL", [this.base_API_URL]);
    	
	
		//Launch the service application and pass initial data
    	tizen.application.launchAppControl(new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/service",null,null,null,[appPortname,servicePortName,appID,base_API_URL]),
    			this.seviceID,
    			onSuccess,
    			onError
    			);	
    	
    } catch (exc) {
        console.error('Exception while launching MovieDb Service: ' +
            exc.message);
    }
};




