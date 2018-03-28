var Service = null;

var _LocalMessagePort = null;
var _LocalMessagePortWatchId = null;
var _RemoteMessagePort = null;   
var grdViewPlaying = null;
var grdViewUpcoming = null;
var tabObject = null;
var sectionChangerWidget = null;


function setupViews(){
	var elGridView = document.getElementById("gridview"),	
    item;
	grdViewPlaying = tau.widget.GridView(elGridView);
	//grdViewPlaying._calculateListHeight();
	
	var elGridViewUpcoming = document.getElementById("gridviewup");
	grdViewUpcoming = tau.widget.GridView(elGridViewUpcoming);
    
   
    var section = document.getElementById("sectionChanger");
    sectionChangerWidget = tau.widget.SectionChanger(section);
    
    jQuery('#sectionChanger').on("sectionchange",function(evt){
    	var activeTab = evt.originalEvent.detail.active;
    	//Load upcoming movies if its not loaded yet
    	if(activeTab == 1 && Service.Upcoming.movie_list.length==0){
    		showOverlay(true);
    		Service.sendCommand("upcoming_movies");
    	}
    });
    

    var tabsElement = document.getElementById("tabs");
    tabObject = tau.widget.Tabs(tabsElement);

    
    jQuery('#btn-nextpage-now').click(function(){
    	
    	if(Service.NowPlaying.current_page<Service.NowPlaying.total_pages){
    		var nextPage = Service.NowPlaying.current_page+1;
    		showOverlay(true);
    	    Service.sendCommand("now_playing",nextPage);	
    	}
    	
    });	
    
    
   jQuery('#btn-nextpage-up').click(function(){
    	
    	if(Service.Upcoming.current_page<Service.Upcoming.total_pages){
    		var nextPage = Service.Upcoming.current_page+1;
    		showOverlay(true);
    	    Service.sendCommand("upcoming_movies",nextPage);	
    	}
    	
    });
   
   
   jQuery('#gridview').on("click",".ui-gridview-item",function(e){
	   var movieID = jQuery(e.target).data('id');

	   if(movieID){
	   var movie = Service.NowPlaying.findMovie(movieID);
	   display_movie_details(movie);
	   }
   });
   
   jQuery('#gridviewup').on("click",".ui-gridview-item",function(e){
	   var movieID = jQuery(e.target).data('id');

	   if(movieID){
	   var movie = Service.Upcoming.findMovie(movieID);
	   display_movie_details(movie);
	   }
   });       
}


function showPopup(title,message,btnText,callback,overlay)
{
	$('#popup').off("popupafterclose");
	$('#popup').unbind("popupafterclose");
	closePopup();
	jQuery("#popup .ui-popup-header").text(title);
	jQuery("#popup .ui-popup-content").text(message);
	jQuery("#popup .ui-btn").text(btnText||'Ok');
	jQuery("#popup").on("popupafterclose", function()
	{

		if(callback){
			if(overlay){
				showOverlay(true);
			}
		  callback.call(this);
		}
		$('#popup').off("popupafterclose");
		$('#popup').unbind("popupafterclose");
	});
	tau.openPopup("#popup");
}

function closePopup(){
	tau.closePopup();
}

//Add movies to the grid lists and update "load More" buttons if there is more data to come
function update_list(list,idStart)
{
	var i = 0;
	if(list=="now_playing"){
		for(i=idStart;i<Service.NowPlaying.movie_list.length;i++){
		
			item = jQuery('<li class="ui-gridview-item" data-id="'+Service.NowPlaying.movie_list[i].id+'"> <img class="ui-gridview-image" src="'+AppConfig._Base_Img_URL+Service.NowPlaying.movie_list[i].backdrop_path+
					'"/>  <div class="movie-thumb-title">'+Service.NowPlaying.movie_list[i].title+'</div> <div class="ui-gridview-handler"></div><div class="dvTag">'+Service.NowPlaying.movie_list[i].vote_average+'</div></li>')[0];		    
		    grdViewPlaying.addItem(item);	    
		}
		if(idStart==0){
			grdViewPlaying.removeItem(jQuery('#gridview li:first')[0]);
			jQuery('#gridview').removeClass('hide-first-el');
		}
		grdViewPlaying._calculateListHeight();
	    tabObject._refresh();
	    sectionChangerWidget.refresh();
	}
	else if(list=="upcoming_movies"){
		for(i=idStart;i<Service.Upcoming.movie_list.length;i++){
		
			item = jQuery('<li class="ui-gridview-item" data-id="'+Service.Upcoming.movie_list[i].id+'"> <img class="ui-gridview-image" src="'+AppConfig._Base_Img_URL+Service.Upcoming.movie_list[i].backdrop_path+
					'"/>  <div class="movie-thumb-title">'+Service.Upcoming.movie_list[i].title+'</div> <div class="ui-gridview-handler"></div><div class="dvTag">'+Service.Upcoming.movie_list[i].vote_average+'</div></li>')[0];		    
			grdViewUpcoming.addItem(item);
		}
		if(idStart==0){
			grdViewUpcoming.removeItem(jQuery('#gridviewup li:first')[0]);
			jQuery('#gridviewup').removeClass('hide-first-el');
		}
		grdViewUpcoming._calculateListHeight();
	    tabObject._refresh();
	    sectionChangerWidget.refresh();
	}

	update_view();
}

//Receives updates from service 
function ServiceCallback(event,data){

	if(event==='status'){
		
	}
	else if(event==='error'){
	  showOverlay(false);
	  showPopup('Service Error!', data.msg, data.btn, data.cb, data.overlay);	
	}
	else if(event==='event'){
		if(data.name==='service_ready'){
			Service.sendCommand("genres");
		}
		if(data.name==='generes_received'){
			Service.sendCommand("now_playing");
		}
		else if(data.name==='now_playing_received'){
			
			update_list("now_playing",data.id);
			showOverlay(false);
			
		}else if(data.name==='upcoming_movies_received'){
			
			update_list("upcoming_movies",data.id);
			showOverlay(false);
			
		}				
	}	
}

//Show / Hide overlay when app is processing data
function showOverlay(bShow)
{
  if(bShow==true){
	  jQuery('#dvOverlay').fadeIn();
  }else{
	  jQuery('#dvOverlay').fadeOut();
  }
}

//visibility of "load More" buttons according to current page and number of pages received from API 
function update_view(){
	if(Service.NowPlaying.current_page<Service.NowPlaying.total_pages){
		jQuery('#btn-nextpage-now').show();	
	}
	else {
		jQuery('#btn-nextpage-now').hide();
	}
	
	if(Service.Upcoming.current_page<Service.Upcoming.total_pages){
		jQuery('#btn-nextpage-up').show();	
	}
	else {
		jQuery('#btn-nextpage-up').hide();
	}
	
}


//Show movie details in another screen
function display_movie_details(movie)
{
	var str = JSON.stringify(movie);
 	window.localStorage.setItem( 'movie_data', str);
	tau.changePage('view/movie_details.html'); 	
}


//Initialization
function initApp(){
		
	setupViews();
	
	showOverlay(true);
    
	try{
		var app = tizen.application.getCurrentApplication();
		AppConfig._appId = app.appInfo.id;

	}
	catch(ex){
		showOverlay(false);
		showPopup('Error!', 'Error retriving app id!', 'Ok');
	}
	
	if(AppConfig._appId)
	{
  	  //Launch Service at startup to be ready for sending / receiving data 	
	  Service = new MovieService(AppConfig, ServiceCallback);
	  Service.startService();
	}
	
}

window.onload = function() {

    // add eventListener for tizenhwkey
    document.addEventListener('tizenhwkey', function(e) {
        if (e.keyName === "back") {
            try {            	
            	var activePopup = document.querySelector('.ui-popup-active'),
				page = document.getElementsByClassName('ui-page-active')[0],
				pageid = page ? page.id : "";          	            	
            	if (pageid === "main" && !activePopup) {
    				try {
    					disConnectFromService();
    					tizen.application.getCurrentApplication().exit();
    				} catch (ignore) {
    				}
    			} else {
    				window.history.back();
    			}

            } catch (ignore) {}
        }
    });


    initApp();

};