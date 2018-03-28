To compile and run the project :

1- Edit MovieApp\js\config.js file and udate the _API_Key : 'YOUR_API_KEY_HERE' with your API from https://developers.themoviedb.org website
2-Import both projects (MovieApp and MovieDBService) in Tizen Studio 
3-Compile and run the project in Tizen Emulator


----------------------------------------------------------------------------------------
Challenges : Sending large string from Service to the App

Json string received from server is usually more than 10,000 characters.
I noticed that Tizen has a limitation in size of string passing between apps.
>>It is not documented what the limitation size is, however i figured that it happens if string is bigger that 12000 charachters long.

To overcome this issue, i split large strings into smaller chunks (10,000 long) and sent them separately.
In app, i merged all strings together to have a valid Json string.

it all happens in "reply_back_data()" function in moviedbservice.c file.
const int MESSAGE_CHUNK_LIMIT = 10000; determines the chunk size. if changed, strings will be sent in even smaller parts.