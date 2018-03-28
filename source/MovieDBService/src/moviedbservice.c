#include <tizen.h>
#include <service_app.h>
#include "moviedbservice.h"
#include <string.h>
#include <curl/curl.h>
#include <net_connection.h>
#include <Ecore.h>
#include "logger.h"
#include <message_port.h>
#include <stdlib.h>
#include <system_info.h>
#include <app.h>
#include <efl_extension.h>
#include <Elementary.h>
#include <app_control.h>
#include <string.h>
#include <stdio.h>


struct MemoryStruct {
	char *memory;
	size_t size;
};

struct MemoryStruct chunk;

char* servicePortName = NULL;
char* appPortname = NULL;
char* appID = NULL;
char* base_API_URL = NULL;

//To split large strings into smaller chunks
const int MESSAGE_CHUNK_LIMIT = 10000;

//Send bundle to web app
void sendBundle(bundle *b){

	int ret;
	ret = message_port_send_message(appID, appPortname, b);
	   if (ret != MESSAGE_PORT_ERROR_NONE)
	   {
		   DBG("message_port_check_remote_port error : %d", ret);
	   }
}

//Send back error to the app
void reply_back_error(char* key, char* data){
	bundle *b = bundle_create();
	bundle_add_str(b, key, "error");
	bundle_add_str(b, "error", data);
	sendBundle(b);
	bundle_free(b);
}

//send json string data received from server to the app
void reply_back_data(char* key, char* data)
{
   int ret;

  //send start signal
   bundle *b = bundle_create();
   bundle_add_str(b, key, "start");
   sendBundle(b);
   bundle_free(b);

   //send chunks
       int iLen = strlen(data);
       int iParts = iLen / MESSAGE_CHUNK_LIMIT;

       int i;
       for(i = 0; i<= iParts; i++){

          int istart = (MESSAGE_CHUNK_LIMIT*i);
          int iCopy = istart+MESSAGE_CHUNK_LIMIT<iLen ? MESSAGE_CHUNK_LIMIT : (iLen-istart);
          char *sToSend = (char*) malloc(iCopy+1);
          strncpy(sToSend, data+istart, iCopy);
          sToSend[iCopy] = '\0';

          //Send chunk of data
          b = bundle_create();
          bundle_add_str(b, key, sToSend);

          sendBundle(b);
          bundle_free(b);

          free(sToSend);
       }

       //send finish signal
        b = bundle_create();
        bundle_add_str(b, key, "finish");
        sendBundle(b);
        bundle_free(b);
}





static size_t
WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
	size_t realsize = size * nmemb;
	struct MemoryStruct *mem = (struct MemoryStruct *)userp;

	mem->memory = realloc(mem->memory, mem->size + realsize + 1);
	if(mem->memory == NULL) {
		return 0;
	}

	memcpy(&(mem->memory[mem->size]), contents, realsize);
	mem->size += realsize;
	mem->memory[mem->size] = 0;

	return realsize;
}

Eina_Bool sendRequest(char* sURL, char* command)
{
	CURL *curl;
	CURLcode curl_err;

	chunk.memory = malloc(1);
	chunk.size = 0;

	curl = curl_easy_init();

	connection_h connection;
	int conn_err;
	conn_err = connection_create(&connection);
	if (conn_err != CONNECTION_ERROR_NONE) {
		/* Error handling */
		ERR("CURL conn_err :(%d)", conn_err);
		ERR("CURL conn_err %s", curl_easy_strerror(conn_err));
		reply_back_error(command,curl_easy_strerror(curl_err));
		return false;
	}

	curl_easy_setopt(curl, CURLOPT_URL, sURL);

	curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);

	/* we pass our 'chunk' struct to the callback function */
	curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);

	curl_err = curl_easy_perform(curl);

	if (curl_err != CURLE_OK) {
		ERR("CURL Error %d", curl_err);
		ERR("CURL Error %s", curl_easy_strerror(curl_err));
		reply_back_error(command,curl_easy_strerror(curl_err));
		return false;
	}

	char* receivedData = (char*)chunk.memory;

	reply_back_data(command,receivedData);

	curl_easy_cleanup(curl);
	free(chunk.memory);
	connection_destroy(connection);

	return true;
}

bool service_app_create(void *data)
{

    return true;
}

void service_app_terminate(void *data)
{

    return;
}

//Receiving commands from Web app and process
void port_callback(int local_port_id, const char *remote_app_id, const char *remote_port,
                bool trusted_remote_port, bundle *message, void *user_data)
{
   char *command = NULL;
   char *data = NULL;
   bundle_get_str(message, "command", &command);
   bundle_get_str(message, "data", &data);

   if(strcasecmp(command,"genres")==0){

      	   char sUrl[1000];
      	   sprintf(sUrl,base_API_URL,"genre/movie/list");
      	   sendRequest(sUrl,command);

         }
   else  if(strcasecmp(command,"now_playing")==0){

	   char sUrl[1000];
	   sprintf(sUrl,base_API_URL,"movie/now_playing");
	   if(data!=NULL && strcmp(data,"null")!=0)
	   {
		   char sPaging[10];
		   strcpy(sPaging,"&page=");
		   strcat(sPaging,data);
		   strcat(sUrl,sPaging);
	   }
	   sendRequest(sUrl,command);
   }
   else if(strcasecmp(command,"upcoming_movies")==0){

	   char sUrl[1000];
	   sprintf(sUrl,base_API_URL,"movie/upcoming");
	   if(data!=NULL && strcmp(data,"null")!=0)
	   {
		   char sPaging[10];
		   strcpy(sPaging,"&page=");
		   strcat(sPaging,data);
		   strcat(sUrl,sPaging);
	   }
	   sendRequest(sUrl,command);
   }

}




void service_app_control(app_control_h app_control, void *data)
{
		char *operation;

		app_control_get_operation(app_control, &operation);

		//Retrieve App Portname and Service Portname for communication between app and service (port messaging)
		app_control_get_extra_data(app_control, "appPortname", &appPortname);
		app_control_get_extra_data(app_control, "servicePortName", &servicePortName);
		app_control_get_extra_data(app_control, "appID", &appID);
		app_control_get_extra_data(app_control, "base_API_URL", &base_API_URL);


		int port_id = message_port_register_local_port(servicePortName, port_callback, NULL);
		if (port_id < 0)
		{
			DBG( "port_id register error : %d", port_id);
		}
		else
		{
			DBG( "port_id : %d", port_id);
		}

    return;
}

static void
service_app_lang_changed(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_LANGUAGE_CHANGED*/
	return;
}

static void
service_app_region_changed(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_REGION_FORMAT_CHANGED*/
}

static void
service_app_low_battery(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_LOW_BATTERY*/
}

static void
service_app_low_memory(app_event_info_h event_info, void *user_data)
{
	/*APP_EVENT_LOW_MEMORY*/
}

int main(int argc, char* argv[])
{
    char ad[50] = {0,};
	service_app_lifecycle_callback_s event_callback;
	app_event_handler_h handlers[5] = {NULL, };

	event_callback.create = service_app_create;
	event_callback.terminate = service_app_terminate;
	event_callback.app_control = service_app_control;

	service_app_add_event_handler(&handlers[APP_EVENT_LOW_BATTERY], APP_EVENT_LOW_BATTERY, service_app_low_battery, &ad);
	service_app_add_event_handler(&handlers[APP_EVENT_LOW_MEMORY], APP_EVENT_LOW_MEMORY, service_app_low_memory, &ad);
	service_app_add_event_handler(&handlers[APP_EVENT_LANGUAGE_CHANGED], APP_EVENT_LANGUAGE_CHANGED, service_app_lang_changed, &ad);
	service_app_add_event_handler(&handlers[APP_EVENT_REGION_FORMAT_CHANGED], APP_EVENT_REGION_FORMAT_CHANGED, service_app_region_changed, &ad);

	return service_app_main(argc, argv, &event_callback, ad);
}
