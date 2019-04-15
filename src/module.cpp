// hello.cc using N-API
#include <node_api.h>
// #include "napi.h"

#include <stdio.h>
#include <string.h>

#include <apollosdk.hpp>

const char * strHandshake = "handshake";

// #define

namespace ApolloConnector {

  apollo_handle_t sessionHandle = 0;
  uint16_t eventId = 0;
  uint32_t numSources = 0;
  const uint64_t* const sources = 0;
  bool dataEnabled = 0;
  uint64_t source = 0;


  // an empty object we can use to store JS callbacks etc.
  napi_value sessionObject = nullptr;

  napi_env temp_env = nullptr;

  // apollo_source_t // sourceType == SOURCE_DEVICEDATA 
  // ApolloPacketBinary
  // ApolloSourceInfo 
  // ApolloRawData // glove - raw
  // ApolloJointData // joint - stream
  // ApolloDeviceInfo // sourceType == SOURCE_DEVICEDATA 

  void handleApolloErrors(void* callbackReturn, apollo_handle_t session, uint16_t errCode, const char * errMsg) {
    printf("error %d %s\n", errCode, errMsg);
  }

  void handleApolloHandshake(void* callbackReturn, apollo_handle_t session, const ApolloPacketBinary * const packetToReturn) {
    napi_status status;
    if (session == sessionHandle) {
        printf("got a handshake\n");

        napi_value eventname;
        napi_value function;
        napi_create_string_utf8(temp_env, strHandshake, strlen(strHandshake), &eventname);

        status = napi_get_property(temp_env, sessionObject, eventname, &function);

        napi_value thethis = nullptr;
        int argc = 0;
        //napi_value argv[];
        napi_value result;
        napi_call_function(temp_env, thethis, function, 0, nullptr, &result);
        
        //napi_set_property(env, sessionObject, eventname, argv[1]);

        // look for the "handshake" function inside of our session's storage

        //std::vector<char> netPacket(packetToReturn->bytes);
        //netPacket.data() = packetToReturn->payload;
        //instance->tcpWrite(netPacket);    // assuming the connector class also handles TCP transactions on a socket
        
        printf("got a handshakeddd\n");
   }
  }

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

  napi_value processPacket(napi_env env, napi_callback_info args) {
    napi_status status;
    size_t argc = 1; // how many args we want
    napi_value argv[1];
    status = napi_get_cb_info(env, args, &argc, argv, NULL, NULL);

    if (argc < 1) return nullptr;

    // verify args[0] is an arraybuffer
    uint32_t * abdata;
    size_t nbytes;
    status = napi_get_arraybuffer_info(env, argv[0], &(void *)abdata, &nbytes);
    //printf("found data %d %i\n", nbytes, abdata[0]);

    ApolloPacketBinary apb;
    apb.bytes = nbytes-4;
    apb.payload = ((char *)(abdata))+4;

    // YES THIS IS A HACK
    temp_env = env;
    apolloProcessPacket(sessionHandle, &apb);
    temp_env = nullptr;




    printf("packet handled~!\n");
  }


  napi_value handshake(napi_env env, napi_callback_info args) {
    napi_status status;
    napi_value greeting;

    // outgoing packet to Apollo:
    // you need to make sure to prepend a 32-bit integer holding the outgoing byte stream length to the byte stream before committing it to Apollo through the TCP socket
    // incoming packet from Apollo:
    // you need to consider that a 32-bit integer holding the incoming byte stream has been prepended by Apollo
    
    // receive packet from Apollo
    // strip transacton size
    // generate ApolloPacketBinary
    // pass to apolloProcessPacket 

      // napi_value createBuffer(napi_env env, napi_callback_info args) {
      //  napi_status status;
      //  cpp - js binary data exchange when size of buffer determined on cpp side not js
      //  output result is a napi_value that corresponds to a javascript ArrayBuffer
      //  status = napi_create_external_arraybuffer(env, void* external_data, size_t byte_length, napi_finalize finalize_cb, &buffer);
      //  if (status != napi_ok) return nullptr;
      //  return buffer;
      // }
        
    ApolloPacketBinary apb = generateHandshake(sessionHandle, eventId); // packet -> handleApolloHandshake -> packet -> handleSuccessfulHandshake
    

    // create arraybuffer around the apb
    void * abdata;
    napi_value ab;
    napi_create_arraybuffer(env, apb.bytes+4, &abdata, &ab);
    memcpy(((char *)abdata)+4, apb.payload, apb.bytes);
    ((uint32_t *)(abdata))[0] = apb.bytes;

    printf("packet %d %s\n", apb.bytes+4, apb.payload);

    // cleanup
    //apolloDisposePacket(apb);
    
    // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
    // generateListSources(sessionHandle, eventId); // get 64-bit list from handleSourcesList -> 'default source' includes pinch data
    // // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
    // generateGetSourceInfo(sessionHandle, source, eventId); // 
    // // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
    // generateAddStreams(sessionHandle, sources, numSources, eventId); // pass array of sources from ListSource -> get handleSuccessfulHandshake response for each source
    // // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
    // generateSetStreamData(sessionHandle, source, dataEnabled, eventId); // dataEnabled true - we want to access stream data (other option is generateSetRawData)
    // // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
    // generateStartStreams(sessionHandle, eventId); // get handleSuccessfulHandshake response -> next packets trigger handleDataStream -> get handleSuccessfulHandshake response
    // // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
    // generateStopStreams(sessionHandle, eventId);
    // // call apolloProcessPacket with the received ApolloPacketBinary before leaving scope - do not pass size into processPacket
  
    status = napi_create_string_utf8(env, "...testing2", NAPI_AUTO_LENGTH, &greeting);
    if (status != napi_ok) return nullptr;
    return ab;
  } // napi generate handshake

  
  // args: "event name", callbackfun
  napi_value on(napi_env env, napi_callback_info args) {
    napi_status status;
    size_t argc = 2; // how many args we want
    napi_value argv[2];
    status = napi_get_cb_info(env, args, &argc, argv, NULL, NULL);


    if (argc < 2) return nullptr;


    // TODO: verify arg types
    // napi_is_string...
    napi_value eventname = argv[0];
    // napi_is_function...
    napi_value function = argv[1];

    // char buf[4096]; // TODO not safe
    // size_t bufsize;
    // napi_get_value_string_utf8(env, eventname, buf, 4096, &bufsize);
    // printf("got event %s\n", buf);

    // store this in sessionObject
    status = napi_set_property(env, sessionObject, eventname, argv[1]);

    // if (strcmp(buf, "handshake") == 0) {
    //   //registerHandshakePacketHandler(sessionHandle, 0, handleApolloHandshake);
    // }

    // napi_value greeting;
    // napi_value fn;

    // // start a session with apollo
    // sessionHandle = apolloOpenSession(0);
    // printf("session %I64u\n", sessionHandle);

    // // register handlers with apollo
    // 
    // registerSuccessHandler(sessionHandle, 0, handleSuccessfulHandshake);
    // registerFailHandler(sessionHandle, 0, handleFailedHandshake);
    // registerDataStreamHandler(sessionHandle, 0, handleDataStream);
    // registerSourcesListHandler(sessionHandle, 0, handleSourcesList);
    // registerSourceInfoHandler(sessionHandle, 0, handleSourceInfo);



    // status = napi_create_string_utf8(env, "...testing", NAPI_AUTO_LENGTH, &greeting);
    // if (status != napi_ok) return nullptr;
    // return greeting;
    return eventname;
  }  // napi on
  
  napi_value openSession(napi_env env, napi_callback_info args) {
    napi_status status;
    napi_value greeting;
    napi_value fn;

    // start a session with apollo
    sessionHandle = apolloOpenSession(0);
    printf("session %I64u\n", sessionHandle);

    // an empty object we can use to store JS callbacks etc.
    napi_create_object(env, &sessionObject);

    // register handlers with apollo
    registerHandshakePacketHandler(sessionHandle, 0, handleApolloHandshake);
    registerSuccessHandler(sessionHandle, 0, handleSuccessfulHandshake);
    registerFailHandler(sessionHandle, 0, handleFailedHandshake);
    registerDataStreamHandler(sessionHandle, 0, handleDataStream);
    registerSourcesListHandler(sessionHandle, 0, handleSourcesList);
    registerSourceInfoHandler(sessionHandle, 0, handleSourceInfo);



    status = napi_create_string_utf8(env, "...testing", NAPI_AUTO_LENGTH, &greeting);
    if (status != napi_ok) return nullptr;
    return sessionObject;
  }  // napi openSession

  napi_value init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    // apollo setup
    registerErrorHandler(0, handleApolloErrors);

    
    status = napi_create_function(env, nullptr, 0, handshake, nullptr, &fn);
    if (status != napi_ok) return nullptr;
    status = napi_set_named_property(env, exports, "handshake", fn);
    if (status != napi_ok) return nullptr;

    
    status = napi_create_function(env, nullptr, 0, on, nullptr, &fn);
    if (status != napi_ok) return nullptr;
    status = napi_set_named_property(env, exports, "on", fn);
    if (status != napi_ok) return nullptr;

    
    status = napi_create_function(env, nullptr, 0, processPacket, nullptr, &fn);
    if (status != napi_ok) return nullptr;
    status = napi_set_named_property(env, exports, "processPacket", fn);
    if (status != napi_ok) return nullptr;

    status = napi_create_function(env, nullptr, 0, openSession, nullptr, &fn);
    if (status != napi_ok) return nullptr;
    status = napi_set_named_property(env, exports, "openSession", fn);
    if (status != napi_ok) return nullptr;

    return exports;
  }  // napi init

  NAPI_MODULE(NODE_GYP_MODULE_NAME, init);

}  // namespace ApolloConnector