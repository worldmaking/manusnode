// hello.cc using N-API
#include <node_api.h>
#include <stdio.h>

#include <apollosdk.hpp>

namespace demo {

  apollo_handle_t apollo_session = 0;


  void handleApolloErrors(void* userdata, apollo_handle_t session, uint16_t errCode, const char * errMsg) {
    printf("error %d %s\n", errCode, errMsg);
  }

  void handleApolloHandShake(void *callbackReturn, apollo_handle_t session, const ApolloPacketBinary * const packet) {
    if (session == apollo_session) {
        printf("got a handshake\n");
        //std::vector<char> netPacket(packet->bytes);
        //netPacket.data() = packet->payload;
        //instance->tcpWrite(netPacket);    // assuming the connector class also handles TCP transactions on a socket
   }
  }

  void successfulApolloHandShake(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const char * successMsg) {
    printf("eventID: %d  |  success: %s\n", eventID, successMsg);
  }

  void failedApolloHandShake(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const char * failMsg) {
    printf("eventID: %d  |  fail: %s\n", eventID, failMsg);
  }

  void registerDataStreamHandler(void* callbackReturn, apollo_handle_t session, const ApolloJointData* const jointData) {
    printf("streaming..");
  }

  void registerSourcesListHandler(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const U64Array* const sourceList) {
    printf("eventID: %d  |  sources: %s\n", eventID, sourceList);
  }

  void registerSourceInfoHandler(void* callbackReturn, apollo_handle_t session, uint16_t eventID, const ApolloSourceInfo* const info) {
    printf("eventID: %d  |  source info: %s\n", eventID, info);
  }



  napi_value openSession(napi_env env, napi_callback_info args) {
    napi_value greeting;
    napi_status status;

    // start a session with apollo
    apollo_session = apolloOpenSession(1234);
    printf("session %I64u\n", apollo_session);

    registerHandshakePacketHandler(apollo_session, 0, handleApolloHandShake);
    registerSuccessHandler(apollo_session, 0, successfulApolloShake);
    registerFailHandler(apollo_session, 0, failedApolloShake);
    registerDataStreamHandler();
    registerSourcesListHandler();
    registerSourceInfoHandler();


    status = napi_create_string_utf8(env, "...test", NAPI_AUTO_LENGTH, &greeting);
    if (status != napi_ok) return nullptr;
    return greeting;
  }

  napi_value init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    // apollo setup
    registerErrorHandler(0, handleApolloErrors);

    status = napi_create_function(env, nullptr, 0, openSession, nullptr, &fn);
    if (status != napi_ok) return nullptr;

    status = napi_set_named_property(env, exports, "hello", fn);
    if (status != napi_ok) return nullptr;
    return exports;
  }

  NAPI_MODULE(NODE_GYP_MODULE_NAME, init);

}  // namespace demo