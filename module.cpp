// hello.cc using N-API
#include <node_api.h>
// #include "napi.h"

#include <stdio.h>

#include <apollosdk.hpp>

// #define

namespace ApolloConnector {

  apollo_handle_t sessionHandle = 0;
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
    if (session == sessionHandle) {
        printf("got a handshake\n");
        //std::vector<char> netPacket(packetToReturn->bytes);
        //netPacket.data() = packetToReturn->payload;
        //instance->tcpWrite(netPacket);    // assuming the connector class also handles TCP transactions on a socket
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
    printf("eventID: %d  |  sources: %s\n", eventID, sourceList);
  }

  void handleSourceInfo(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const ApolloSourceInfo * const info) {
    printf("eventID: %d  |  source info: %s\n", eventID, info);
  }



  napi_value openSession(napi_env env, napi_callback_info args) {
    napi_status status;
    napi_value greeting;

    // start a session with apollo
    sessionHandle = apolloOpenSession(1234);
    printf("session %I64u\n", sessionHandle);

    // register handlers with apollo
    registerHandshakePacketHandler(sessionHandle, 0, handleApolloHandshake);
    registerSuccessHandler(sessionHandle, 0, handleSuccessfulHandshake);
    registerFailHandler(sessionHandle, 0, handleFailedHandshake);
    registerDataStreamHandler(sessionHandle, 0, handleDataStream);
    registerSourcesListHandler(sessionHandle, 0, handleSourcesList);
    registerSourceInfoHandler(sessionHandle, 0, handleSourceInfo);


    status = napi_create_string_utf8(env, "...testing", NAPI_AUTO_LENGTH, &greeting);
    if (status != napi_ok) return nullptr;
    return greeting;
  }  // napi openSession

  napi_value init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    // apollo setup
    registerErrorHandler(0, handleApolloErrors);

    status = napi_create_function(env, nullptr, 0, openSession, nullptr, &fn);
    if (status != napi_ok) return nullptr;

    status = napi_set_named_property(env, exports, "connectApollo", fn);
    if (status != napi_ok) return nullptr;
    return exports;
  }  // napi init

  NAPI_MODULE(NODE_GYP_MODULE_NAME, init);

}  // namespace ApolloConnector