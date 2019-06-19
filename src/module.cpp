// hello.cc using N-API
#include <node_api.h>
// #include "napi.h"

#include <stdio.h>
#include <string.h>
#include <assert.h>

#include <apollosdk.hpp>

/*
Usage:

// in client connect():

// open session & register handlers:
session = manus.open({
  onHandshake: function(arraybuf) {
    ...
  },
  // etc.
});

// send to client:
client.write(Buffer.from(manus.handshake()));

// in client.on("data):

// will call the session's registered handlers
session.process(data.buffer)

// maybe later?
session.on("handshake", function() {...})  

  */


// a C++ struct to hold all the persistent JS objects we need for an Apollo session:
struct PersistentSessionData {
  apollo_handle_t sessionHandle;
  napi_env env;
  napi_ref sessionRef;
  napi_ref onHandshakeRef;
  // TODO napi_ref for the other events Apollo can register
};

void handleApolloErrors(void* callbackReturn, apollo_handle_t session, uint16_t errCode, const char * errMsg) {
  // TODO: can this pipe through as an exception to node.js intead?
  fprintf(stderr, "error %d %s\n", errCode, errMsg);
}


// session.process(arraybuffer)
// will trigger the various handlers registered for the session
napi_value process(napi_env env, napi_callback_info args) {
  napi_status status;
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);

  if (argc < 1) return nullptr;

  // verify args[0] is an arraybuffer
  uint32_t * abdata;
  size_t nbytes;
  status = napi_get_arraybuffer_info(env, argv[0], &(void *)abdata, &nbytes);
  //printf("found data %d %i\n", nbytes, abdata[0]);

  // outgoing packet to Apollo:
  // you need to make sure to prepend a 32-bit integer holding the outgoing byte stream length to the byte stream before committing it to Apollo through the TCP socket
  ApolloPacketBinary apb;
  apb.bytes = nbytes-4;
  apb.payload = ((char *)(abdata))+4;

  // TODO -- is there a return value to pass back to JS?
  apolloProcessPacket(data->sessionHandle, &apb);

  return nullptr;
}

napi_value handshake(napi_env env, napi_callback_info args) {
  napi_status status;
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  // receive packet from Apollo
  // strip transacton size
  // generate ApolloPacketBinary
  // pass to apolloProcessPacket 
      
  uint16_t eventId = 0; // TODO, is this always zero?
  ApolloPacketBinary apb = generateHandshake(data->sessionHandle, eventId); 
  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((uint32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

// TODO: equivalent for
// generateListSources(sessionHandle, eventId); // get 64-bit list from handleSourcesList -> 'default source' includes pinch data
  // generateGetSourceInfo(sessionHandle, source, eventId); // 
  // generateAddStreams(sessionHandle, sources, numSources, eventId); // pass array of sources from ListSource -> get handleSuccessfulHandshake response for each source
  // generateSetStreamData(sessionHandle, source, dataEnabled, eventId); // dataEnabled true - we want to access stream data (other option is generateSetRawData)
  // generateStartStreams(sessionHandle, eventId); // get handleSuccessfulHandshake response -> next packets trigger handleDataStream -> get handleSuccessfulHandshake response
  // generateStopStreams(sessionHandle, eventId);




// an example Apollo handler calling back into a registered JS function:
void handleApolloHandshake(void * callbackReturn, apollo_handle_t session, const ApolloPacketBinary * const packetToReturn) {
  SessionData * data = (SessionData *)callbackReturn;

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	napi_get_reference_value(data->env, data->sessionRef, &sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	napi_get_reference_value(data->env, data->onHandshakeRef, &callback);
	
	// call it: 
  int argc = 1;
  napi_value argv[1];

  // create arraybuffer from the ApolloPacketBinary:
  void * abdata;
  napi_create_arraybuffer(data->env, packetToReturn.bytes+4, &abdata, &argv[0]);
  memcpy(((char *)abdata)+4, packetToReturn.payload, packetToReturn.bytes);
  ((uint32_t *)(abdata))[0] = packetToReturn.bytes;

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);
}

// TODO implement others too:
void handleSuccessfulHandshake(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const char * successMsg) {
  printf("eventID: %d  |  success: %s\n", eventID, successMsg);
}

void handleFailedHandshake(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const char * failMsg) {
  printf("eventID: %d  |  fail: %s\n", eventID, failMsg);
}

void handleDataStream(void* callbackReturn, apollo_handle_t session, const ApolloJointData * const jointData) {
  printf("streaming..");
}

void handleSourcesList(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const U64Array * const sourceList) {
  // generate list of sources connected to Apollo, i.e., L and R glove
  printf("eventID: %d  |  sources: %s\n", eventID, sourceList);
}

void handleSourceInfo(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const ApolloSourceInfo * const info) {
  // want L/R side from ApolloSoureInfo struct -> apollo_laterality_t
  printf("eventID: %d  |  source info: %d\n", eventID, info);
}

napi_value open(napi_env env, napi_callback_info info) {
  napi_status status;
  // expect 1 argument:
  size_t argc = 1;
	napi_value args[1];
  status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  // create a PersistentSessionData to hold our JS functions etc. in for this session:
  PersistentSessionData * data = new PersistentSessionData;

  // start a session with apollo
  data->sessionHandle = apolloOpenSession(0);

  // argument args[0] should be a JS object with all the handlers in it
  // we'll need to store references to them in our PersistentSessionData to prevent garbage collection
  napi_value handler;
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onHandshake", handler);
  napi_create_reference(env, handler, 1, &data->onHandshakeRef);

  // and also register the corresponding events with Apollo:
  registerHandshakePacketHandler(data->sessionHandle, data, handleHandshake);

  // TODO: register the other event handlers...
  // registerSuccessHandler(sessionHandle, data, handleSuccessfulHandshake);
  // registerFailHandler(sessionHandle, data, handleFailedHandshake);
  // registerDataStreamHandler(sessionHandle, data, handleDataStream);
  // registerSourcesListHandler(sessionHandle, data, handleSourcesList);
  // registerSourceInfoHandler(sessionHandle, data, handleSourceInfo);


  // we will return a persistent object to talk to the session:
  napi_value sessionObject;
  assert(napi_create_object(env, &sessionObject) == napi_ok);
  assert(napi_create_reference(env, sessionObject, 1, &data->sessionRef) == napi_ok);
    
  assert(napi_create_function(env, "handshake", 0, handshake, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "handshake", fn) == napi_ok);

  assert(napi_create_function(env, "process", 0, process, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "process", fn) == napi_ok);

  // TODO: more session methods, including the various generators, and also a close() to delete PersistentSessionData and destroy the references it contains

  return sessionObject
}

napi_value init(napi_env env, napi_value exports) {
  napi_status status;
  napi_value fn;

  // apollo setup
  registerErrorHandler(0, handleApolloErrors);

  // register the module's functions: 
  assert(napi_create_function(env, nullptr, 0, open, nullptr, &fn) == napi_ok);
  assert(napi_set_named_property(env, exports, "open", fn) == napi_ok);
  
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);
