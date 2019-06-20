{
    "targets": [{
        "target_name": "manusnode",
        "sources": ["src/module.cpp"],
        "include_dirs": [
            "../resources_2018_09_18_Apollo-SDK-1.1.1_Windows/release/include"
        ],
        "cflags": ["-std=c++11", "-Wall", "-pedantic"],
        'conditions': [
            ['OS=="linux"', {
                "libraries": [
                    "../../resources_2018_09_18_Apollo-SDK-1.1.1_Windows/release/libApolloSDK.so",
                ],
            }],
            ['OS=="mac"', {}],
            ['OS=="win"', {
                "libraries": [
                    "../../resources_2018_09_18_Apollo-SDK-1.1.1_Windows/release/ApolloSDK.lib",
                ],
            }],
        ],
    }]
}