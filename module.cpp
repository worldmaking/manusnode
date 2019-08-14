#include <node_api.h>
#include <apollosdk.h>

#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <malloc.h>

// a C++ struct to hold all the persistent JS objects we need for an Apollo session:
struct PersistentSessionData {
  apollo_handle_t sessionHandle;
  napi_env env;
  napi_ref sessionRef;
  napi_ref onHandshakeRef, onSuccessRef, onFailRef, onDataRef, onRawRef, onDongleListRef, onDeviceListRef, onDeviceInfoRef, onSourcesListRef, onSourceInfoRef, onQueryRef;
};

// the various generateXXX methods:

napi_value handshake(napi_env env, napi_callback_info args) {
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int32_t eventId = 0;
  napi_get_value_int32(env, argv[0], &eventId);
  printf("CPP: napi handshake event %d\n", eventId);
  ApolloPacketBinary apb = generateHandshake(data->sessionHandle, eventId); 
  
  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((uint32_t *)(abdata))[0] = apb.bytes;

  printf("CPP: napi sending handshake event %d packet x%d - %s\n", eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value listSources(napi_env env, napi_callback_info args) {
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int32_t eventId; //= 0;
  napi_get_value_int32(env, argv[0], &eventId);
  //printf("CPP: napi listSources event %d\n", eventId);
  ApolloPacketBinary apb = generateListSources(data->sessionHandle, eventId); 

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((uint32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending listsources event %d packet x%d - %s\n", eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value getSourceInfo(napi_env env, napi_callback_info args) {
  size_t argc = 2; // how many args we want
  napi_value argv[2];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t source = 0;
  int32_t eventId = 0;
  napi_get_value_int64(env, argv[0], &source);
  napi_get_value_int32(env, argv[1], &eventId);
  ApolloPacketBinary apb = generateGetSourceInfo(data->sessionHandle, source, eventId); 

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((uint32_t *)(abdata))[0] = apb.bytes;
  
  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending getsourceinfo source %I64d and event %d packet x%d - %s\n", source, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value startStreams(napi_env env, napi_callback_info args) {
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int32_t eventId = 0;
  napi_get_value_int32(env, argv[0], &eventId);
  ApolloPacketBinary apb = generateStartStreams(data->sessionHandle, eventId); 

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((uint32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending startstreams event %d packet x%d - %s\n", eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value stopStreams(napi_env env, napi_callback_info args) {
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);

  int32_t eventId = 0;
  napi_get_value_int32(env, argv[0], &eventId);
  ApolloPacketBinary apb = generateStopStreams(data->sessionHandle, eventId); 

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((uint32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending stopstreams event %d packet x%d - %s\n", eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value listDongleID(napi_env env, napi_callback_info args) {
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int32_t eventId; //= 0;
  napi_get_value_int32(env, argv[0], &eventId);
  ApolloPacketBinary apb = generateListDongleIDs(data->sessionHandle, eventId); 
  //printf("CPP: eventID %d \n", eventId);
  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending listdongles event %d packet x%d - %s\n", eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value listDeviceID(napi_env env, napi_callback_info args) {
  size_t argc = 2; // how many args we want
  napi_value argv[2];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t dongleID = 0;
  int32_t eventId = 0;
  napi_get_value_int64(env, argv[0], &dongleID);
  napi_get_value_int32(env, argv[1], &eventId);
  ApolloPacketBinary apb = generateListDeviceIDs(data->sessionHandle, dongleID, eventId); 

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending listdevices dongle %I64d event %d packet x%d - %s\n", dongleID, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

napi_value getDeviceInfo(napi_env env, napi_callback_info args) {
  size_t argc = 2; // how many args we want
  napi_value argv[2];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t deviceID = 0;
  int32_t eventId = 0;
  napi_get_value_int64(env, argv[0], &deviceID);
  napi_get_value_int32(env, argv[1], &eventId);
  ApolloPacketBinary apb = generateGetDeviceInfo(data->sessionHandle, deviceID, eventId); 

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;
  
  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending getdeviceinfo device %I64d and event %d packet x%d - %s\n", deviceID, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;  
}

// TODO: handle array... 
// generateAddStreams(sessionHandle, sources, numSources, eventId); // pass array of sources from ListSource -> get handleSuccessfulHandshake response for each source
napi_value addStreams(napi_env env, napi_callback_info args) {
  size_t argc = 3; // how many args we want
  napi_value argv[3];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t const sources = 0; // list of source endpoint IDs from listSources 
  int32_t numSources = 0;
  int32_t eventId = 0;
  // napi_get_value_bigint_words(env, argv[0], NULL, &numSources, NULL);
  // napi_get_value_bigint_uint64(env, argv[0], &sources);
  // napi_get_value_int64(env, argv[0], &sources);
  napi_get_value_int32(env, argv[1], &numSources);
  napi_get_value_int32(env, argv[2], &eventId);
  ApolloPacketBinary apb = generateAddStreams(data->sessionHandle, sources, numSources, eventId);

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending addstreams numsources %d event %d packet x%d %s\n", numSources, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}
// TODO: handle array... 
// generateRemoveStreams(sessionHandle, sources, numSources, eventId); // pass array of sources from ListSource -> get handleSuccessfulHandshake response for each source
napi_value removeStreams(napi_env env, napi_callback_info args) {
  size_t argc = 3; // how many args we want
  napi_value argv[3];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t const sources = 0; // list of source endpoint IDs from listSources 
  int32_t numSources = 0;
  int32_t eventId = 0;
  napi_get_value_int32(env, argv[1], &numSources);
  // TODO: use numSources to extract sourceIDs from the sources list?? 
  napi_get_value_int32(env, argv[2], &eventId);
  ApolloPacketBinary apb = generateRemoveStreams(data->sessionHandle, sources, numSources, eventId);

  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending removestreams numsources %d event %d packet x%d %s\n", numSources, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
}

// dataEnabled true - if we want to access stream data (other option is generateSetStreamRaw)
napi_value setStreamData(napi_env env, napi_callback_info args) {
  size_t argc = 3; // how many args we want
  napi_value argv[3];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t source = 0;
  bool dataEnabled = false;
  int32_t eventId = 0;
  napi_get_value_int64(env, argv[0], &source);
  napi_get_value_bool(env, argv[1], &dataEnabled);
  napi_get_value_int32(env, argv[2], &eventId);
  ApolloPacketBinary apb = generateSetStreamData(data->sessionHandle, source, dataEnabled, eventId); 
  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending setstreamdata source %I64d data Y/N %d event %d packet x%d %s\n", source, dataEnabled, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;  
}

// rawEnabled true - if we want to access raw data (other option is generateSetStreamData)
napi_value setStreamRaw(napi_env env, napi_callback_info args) {
  size_t argc = 3; // how many args we want
  napi_value argv[3];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int64_t source = 0;
  bool rawEnabled = false;
  int32_t eventId = 0;
  napi_get_value_int64(env, argv[0], &source);
  napi_get_value_bool(env, argv[1], &rawEnabled);
  napi_get_value_int32(env, argv[2], &eventId);
  ApolloPacketBinary apb = generateSetStreamRaw(data->sessionHandle, source, rawEnabled, eventId); 
  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  //printf("packet %d %s\n", apb.bytes+4, apb.payload);
  printf("CPP: napi sending setstreamdata source %I64d data Y/N %d event %d packet x%d %s\n", source, rawEnabled, eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;  
}

napi_value queryEvent(napi_env env, napi_callback_info args) {
  size_t argc = 1; // how many args we want
  napi_value argv[1];
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, argv, NULL, (void **)&data) == napi_ok);
  
  int32_t eventId = 0;
  napi_get_value_int32(env, argv[0], &eventId);
  ApolloPacketBinary apb = generateQueryEvent(data->sessionHandle, eventId); 
  
  // incoming packet from Apollo:
  // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
  // create arraybuffer around the apb
  void * abdata;
  napi_value ab;
  napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
  memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
  ((int32_t *)(abdata))[0] = apb.bytes;

  printf("CPP: napi sending query event %d packet x%d %s\n", eventId, apb.bytes+4, apb.payload);

  // cleanup
  apolloDisposePacket(apb);
  
  return ab;
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
  status = napi_get_arraybuffer_info(env, argv[0], (void **)&abdata, &nbytes);
  printf("CPP: napi process found data %lld %i\n", nbytes, abdata[0]);
  // outgoing packet to Apollo:
  // you need to make sure to prepend a 32-bit integer holding the outgoing byte stream length to the byte stream before committing it to Apollo through the TCP socket
  ApolloPacketBinary apb;
  apb.bytes = nbytes-4;
  apb.payload = ((char *)(abdata))+4;
  apolloProcessPacket(data->sessionHandle, &apb);

  // cleanup? (crashes, so commented it out)
  //apolloDisposePacket(apb);

  printf("CPP: napi process complete\n");

  // cleanup? (crashes, so commented it out)
  //apolloDisposePacket(apb);

  return nullptr;
}

// end a session
// session.close()
napi_value close(napi_env env, napi_callback_info args) {
  printf("CPP: napi close session");
  size_t argc = 0; // how many args we want
  PersistentSessionData * data; // the C++ data we can associate with a function
  assert(napi_get_cb_info(env, args, &argc, nullptr, nullptr, (void **)&data) == napi_ok);
  
  apolloCloseSession(data->sessionHandle);

  return nullptr;
}

// Apollo handlers calling back into the registered JS functions:

void handleHandshake(void* callbackReturn, apollo_handle_t session, const ApolloPacketBinary * packetToReturn) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: handleHandshake with packet %p\n", packetToReturn);
  printf("CPP: handleHandshake data pointer is %p; env %p, object %p callback %p\n", data, data->env, data->sessionRef, data->onHandshakeRef);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleHandshake with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	assert(napi_ok == napi_get_reference_value(data->env, data->onHandshakeRef, &callback));
  napi_typeof(data->env, callback, &resultType);
  assert(resultType == napi_function);
	
  // printf("CPP: handleHandshake with callback %p\n", callback);

	// call it: 
  int argc = 1;
  napi_value argv[1];

  // create arraybuffer from the ApolloPacketBinary:
  void * abdata;
  napi_create_arraybuffer(data->env, packetToReturn->bytes+4, &abdata, &argv[0]);
  memcpy(((char *)abdata)+4, packetToReturn->payload, packetToReturn->bytes);
  ((uint32_t *)(abdata))[0] = packetToReturn->bytes;

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleHandshake complete\n");
}

void handleSuccess(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const char * successMsg) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: eventID: %d  |  success: %p\n", eventID, successMsg);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleSuccess with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	assert(napi_ok == napi_get_reference_value(data->env, data->onSuccessRef, &callback));
  napi_typeof(data->env, callback, &resultType);
  assert(resultType == napi_function);

  // printf("CPP: handleSuccess with callback %p\n", callback);
	
	// call it: 
  int argc = 2;
  napi_value argv[2];

  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  assert(napi_create_string_utf8(data->env, successMsg, strlen(successMsg), &argv[1]) == napi_ok);

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleSuccess complete\n");

}

void handleFail(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const char * failMsg) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: eventID: %d  |  fail: %p\n", eventID, failMsg);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleFail with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	assert(napi_ok == napi_get_reference_value(data->env, data->onFailRef, &callback));
  napi_typeof(data->env, callback, &resultType);
  assert(resultType == napi_function);

  // printf("CPP: handleFail with callback %p\n", callback);
	
	// call it: 
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  assert(napi_create_string_utf8(data->env, failMsg, strlen(failMsg), &argv[1]) == napi_ok);

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleFail complete\n");

}

void handleSourcesList(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const U64Array * const sourceList) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  uint32_t numSources = sourceList->size;

  // generate list of sources connected to Apollo, i.e., L and R glove
  printf("CPP: eventID: %d  |  sources: %p\n", eventID, sourceList);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleSourcesList with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	napi_get_reference_value(data->env, data->onSourcesListRef, &callback);
	
    // printf("CPP: handleSourcesList with callback %p\n", callback);

	// call it: 
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  //assert(napi_create_array_with_length(data->env, sizeof(sourceList), &argv[1]) == napi_ok);
  napi_value ab;
  void* abdata;
  assert(napi_ok == napi_create_arraybuffer(data->env, sizeof(uint64_t) * numSources, &abdata, &ab));

  memcpy(abdata, sourceList->entries, sizeof(uint64_t) * numSources);
  assert(napi_ok == napi_create_typedarray(data->env, napi_bigint64_array, numSources, ab, 0, &argv[1]));

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleSourcesList complete\n");

}

void handleSourceInfo(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const ApolloSourceInfo * const info) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  // want L/R side from ApolloSoureInfo struct -> apollo_laterality_t
  printf("CPP: eventID: %d  |  source info: %p\n", eventID, info);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleSourceInfo with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	napi_get_reference_value(data->env, data->onSourceInfoRef, &callback);
	
  // printf("CPP: handleSourceInfo with callback %p\n", callback);

	// call it: 
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  assert(napi_create_array_with_length(data->env, sizeof(info), &argv[1]) == napi_ok);
  
  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);
 
  printf("CPP: handleSourceInfo complete\n");

}

void handleDataStream(void* callbackReturn, apollo_handle_t session, const ApolloJointData * const jointData) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: handleDataStream with jointData %p\n", jointData);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleDataStream with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	assert(napi_ok == napi_get_reference_value(data->env, data->onDataRef, &callback));
  napi_typeof(data->env, callback, &resultType);
  assert(resultType == napi_function);

  // printf("CPP: handleDataStream with callback %p\n", callback);
	
	// call it: 
  int argc = 1;
  napi_value argv[1];
  assert(napi_create_array_with_length(data->env, sizeof(jointData), &argv[1]) == napi_ok);
  
  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleDataStream complete\n");

}

void handleRawStream(void* callbackReturn, apollo_handle_t session, const ApolloRawData * const rawData) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: handleRawStream with rawData %p\n", rawData);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleRawStream with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	assert(napi_ok == napi_get_reference_value(data->env, data->onRawRef, &callback));
  napi_typeof(data->env, callback, &resultType);
  assert(resultType == napi_function);

  // printf("CPP: handleRawStream with callback %p\n", callback);
	
	// call it: 
  int argc = 1;
  napi_value argv[1];
  assert(napi_create_array_with_length(data->env, sizeof(rawData), &argv[1]) == napi_ok);

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleRawStream complete\n");

}

void handleDongleList(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const U64Array* const dongleList) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  uint32_t numDongles = dongleList->size;

  printf("CPP: eventID: %d  |  dongles: %p\n", eventID, dongleList);

   // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleDongleList with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	napi_get_reference_value(data->env, data->onDongleListRef, &callback);
	
	// printf("CPP: handleDongleList with callback %p\n", callback);

  // call it: 
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  //assert(napi_create_array_with_length(data->env, numDongles, &argv[1]) == napi_ok);
  napi_value ab;
  void* abdata;
  assert(napi_ok == napi_create_arraybuffer(data->env, sizeof(uint64_t) * numDongles, &abdata, &ab));

  memcpy(abdata, dongleList->entries, sizeof(uint64_t) * numDongles);
  assert(napi_ok == napi_create_typedarray(data->env, napi_bigint64_array, numDongles, ab, 0, &argv[1]));
  
  //argv[1] = (*)reinterpret_cast
   
  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleDongleList complete\n");
  
}

void handleDeviceIdList(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const U64Array* const deviceList) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  uint32_t numDevices = deviceList->size;
  
  printf("CPP: eventID: %d  |  sources: %p\n", eventID, deviceList);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleFail with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	napi_get_reference_value(data->env, data->onDeviceListRef, &callback);
	
  // printf("CPP: handleFail with callback %p\n", callback);

	// call it: 
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  //assert(napi_create_array_with_length(data->env, sizeof(deviceList), &argv[1]) == napi_ok);
  
  napi_value ab;
  void* abdata;
  assert(napi_ok == napi_create_arraybuffer(data->env, sizeof(uint64_t) * numDevices, &abdata, &ab));

  memcpy(abdata, deviceList->entries, sizeof(uint64_t) * numDevices);
  assert(napi_ok == napi_create_typedarray(data->env, napi_bigint64_array, numDevices, ab, 0, &argv[1]));

  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleDeviceList complete\n");
  
}

void handleDeviceInfo(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const ApolloDeviceInfo* const deviceInfo) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: eventID: %d  |  deviceInfo: %p\n", eventID, deviceInfo);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleDeviceInfo with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
	napi_value callback; 
	napi_get_reference_value(data->env, data->onDeviceInfoRef, &callback);
	
  // printf("CPP: handleDeviceInfo with callback %p\n", callback);

	// call it: 
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  assert(napi_create_array_with_length(data->env, sizeof(deviceInfo), &argv[1]) == napi_ok);
  
  // pass this as an argument to the registered callback:
	napi_value result;
	assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleDeviceInfo complete\n");
  
}



void handleQuery(void* callbackReturn, apollo_handle_t session, uint16_t eventID, uint16_t eventStatusCode) {
  PersistentSessionData * data = (PersistentSessionData *)callbackReturn;

  printf("CPP: eventID: %d  |  query status: %d\n", eventID, eventStatusCode);

  // pull the session object back out of the napi_ref:
	napi_value sessionObject; 
	assert(napi_ok == napi_get_reference_value(data->env, data->sessionRef, &sessionObject));

  napi_valuetype resultType;
  napi_typeof(data->env, sessionObject, &resultType);
  assert(resultType == napi_object);

  // printf("CPP: handleQuery with object %p\n", sessionObject);

  // pull the callback function back out of the napi_ref:
  napi_value callback;
  napi_get_reference_value(data->env, data->onQueryRef, &callback);

  // printf("CPP: handleQuery with callback %p\n", callback);

  // call it:
  int argc = 2;
  napi_value argv[2];
  assert(napi_create_int32(data->env, eventID, &argv[0]) == napi_ok);
  assert(napi_create_int32(data->env, eventStatusCode, &argv[1]) == napi_ok);

  // pass this as an argument to the registered callback:
  napi_value result;
  assert(napi_call_function(data->env, sessionObject, callback, argc, argv, &result) == napi_ok);

  printf("CPP: handleQuery complete\n");

}

// this function opens a session & registers the handlers:
napi_value open(napi_env env, napi_callback_info info) {
  napi_status status;
  // expect 1 argument:
  size_t argc = 1;
	napi_value args[1];
  status = napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  // create a PersistentSessionData to hold our JS functions etc. in for this session:
  PersistentSessionData * data = new PersistentSessionData;
  printf("CPP: napi open our persistent data pointer is %p\n", data);

  // start a session with apollo
  data->sessionHandle = apolloOpenSession(0);
  data->env = env;

  // argument args[0] should be a JS object with all the handlers in it
  // we'll need to store references to them in our PersistentSessionData to prevent garbage collection
  napi_value handler;
  bool exists = false;

  // and also register the corresponding events with Apollo:
  registerHandshakePacketHandler(data->sessionHandle, data, handleHandshake);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onHandshake", &handler);
  napi_has_named_property(env, args[0], "onHandshake", &exists);
  printf("CPP: onHandshake exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onHandshakeRef);

  exists = false;
  registerSuccessHandler(data->sessionHandle, data, handleSuccess);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onSuccess", &handler);
  napi_has_named_property(env, args[0], "onSuccess", &exists);
  printf("CPP: onSuccess exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onSuccessRef);

  exists = false;
  registerFailHandler(data->sessionHandle, data, handleFail);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onFail", &handler);
  napi_has_named_property(env, args[0], "onFail", &exists);
  printf("CPP: onFail exists? %d\n", exists);  
  if (exists) napi_create_reference(env, handler, 1, &data->onFailRef);

  exists = false;
  registerDataStreamHandler(data->sessionHandle, data, handleDataStream);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onData", &handler);
  napi_has_named_property(env, args[0], "onData", &exists);
  printf("CPP: onData exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onDataRef);

  exists = false;
  registerRawStreamHandler(data->sessionHandle, data, handleRawStream);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onRaw", &handler);
  napi_has_named_property(env, args[0], "onRaw", &exists);
  printf("CPP: onRaw exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onRawRef);

  exists = false;
  registerDongleIdListHandler(data->sessionHandle, data, handleDongleList);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onDongleList", &handler);
  napi_has_named_property(env, args[0], "onDongleList", &exists);
  printf("CPP: onDongleList exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onDongleListRef);

  exists = false;
  registerDeviceIdListHandler(data->sessionHandle, data, handleDeviceIdList);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onDeviceList", &handler);
  napi_has_named_property(env, args[0], "onDeviceList", &exists);
  printf("CPP: onDeviceList exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onDeviceListRef);

  exists = false;
  registerDeviceInfoHandler(data->sessionHandle, data, handleDeviceInfo);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onDeviceInfo", &handler);
  napi_has_named_property(env, args[0], "onDeviceInfo", &exists);
  printf("CPP: onDeviceInfo exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onDeviceInfoRef);

  exists = false;
  registerSourcesListHandler(data->sessionHandle, data, handleSourcesList);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onSourcesList", &handler);
  napi_has_named_property(env, args[0], "onSourcesList", &exists);
  printf("CPP: onSourcesList exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onSourcesListRef);

  exists = false;
  registerSourceInfoHandler(data->sessionHandle, data, handleSourceInfo);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onSourceInfo", &handler);
  napi_has_named_property(env, args[0], "onSourceInfo", &exists);
  printf("CPP: onSourceInfo exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onSourceInfoRef);

  exists = false;
  registerQueryHandler(data->sessionHandle, data, handleQuery);
  // TODO: check for existence before registering?
  napi_get_named_property(env, args[0], "onQuery", &handler);
  napi_has_named_property(env, args[0], "onQuery", &exists);
  printf("CPP: onQuery exists? %d\n", exists);
  if (exists) napi_create_reference(env, handler, 1, &data->onQueryRef);

  // we will return a persistent object to talk to the session:
  napi_value sessionObject;
  assert(napi_create_object(env, &sessionObject) == napi_ok);
  assert(napi_create_reference(env, sessionObject, 1, &data->sessionRef) == napi_ok);
  
  napi_value fn;

  // the various "generateXXX" methods for making packets to send to Apollo:
  assert(napi_create_function(env, "handshake", 0, handshake, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "handshake", fn) == napi_ok);

  assert(napi_create_function(env, "startStreams", 0, startStreams, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "startStreams", fn) == napi_ok);
  assert(napi_create_function(env, "stopStreams", 0, stopStreams, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "stopStreams", fn) == napi_ok);

  assert(napi_create_function(env, "addStreams", 0, addStreams, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "addStreams", fn) == napi_ok);
  assert(napi_create_function(env, "removeStreams", 0, removeStreams, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "removeStreams", fn) == napi_ok);

  assert(napi_create_function(env, "setStreamData", 0, setStreamData, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "setStreamData", fn) == napi_ok);
  assert(napi_create_function(env, "setStreamRaw", 0, setStreamRaw, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "setStreamRaw", fn) == napi_ok);

  assert(napi_create_function(env, "listSources", 0, listSources, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "listSources", fn) == napi_ok);
  assert(napi_create_function(env, "getSourceInfo", 0, getSourceInfo, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "getSourceInfo", fn) == napi_ok);

  assert(napi_create_function(env, "listDongleID", 0, listDongleID, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "listDongleID", fn) == napi_ok);
  assert(napi_create_function(env, "listDeviceID", 0, listDeviceID, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "listDeviceID", fn) == napi_ok);
  assert(napi_create_function(env, "getDeviceInfo", 0, getDeviceInfo, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "getDeviceInfo", fn) == napi_ok);

  assert(napi_create_function(env, "queryEvent", 0, queryEvent, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "queryEvent", fn) == napi_ok);


  // handle & dispatch packets returned by Apollo:
  assert(napi_create_function(env, "process", 0, process, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "process", fn) == napi_ok);

  // done:
  assert(napi_create_function(env, "close", 0, close, data, &fn) == napi_ok);
  assert(napi_set_named_property(env, sessionObject, "close", fn) == napi_ok);

  return sessionObject;
}

// generic error handler:
void handleApolloErrors(void* callbackReturn, apollo_handle_t session, uint16_t errCode, const char * errMsg) {
  // TODO: can this pipe through as an exception to node.js intead?
  fprintf(stderr, "CPP: handleApolloErrors with err %d %s\n", errCode, errMsg);
}

napi_value init(napi_env env, napi_value exports) {
  napi_value fn;

  // apollo setup
  registerErrorHandler(0, handleApolloErrors);

  // register the module's functions: 
  assert(napi_create_function(env, nullptr, 0, open, nullptr, &fn) == napi_ok);
  assert(napi_set_named_property(env, exports, "open", fn) == napi_ok);
  
  printf("CPP: napi init initializing module \n");
  
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);
