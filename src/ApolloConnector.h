#pragma once

#include <napi.h>

class ApolloConnector : public Napi::ObjectWrap<ApolloConnector>
{
public:
    ApolloConnector(const Napi::CallbackInfo&);
    Napi::Value Greet(const Napi::CallbackInfo&);

    static Napi::Function GetClass(Napi::Env);

private:
    std::string _greeterName;
};
