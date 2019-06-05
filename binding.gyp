{
    "targets": [{
        "target_name": "manusnode",
        "sources": ["src/module.cpp"],
        "include_dirs": [
            "node_modules/nan",
            "../resources_2018_09_18_Apollo-SDK-1.1.1_Windows/release/include"
        ],
        "libraries": [
            "../../resources_2018_09_18_Apollo-SDK-1.1.1_Windows/release/ApolloSDK.lib",
        ],

        "cflags": ["-std=c++11", "-Wall", "-pedantic"]
    }]
}