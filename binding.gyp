{
    "targets": [{
        "target_name": "manusnode",
        "sources": ["module.cpp"],
        "include_dirs": [
            "node_modules/nan",
            "../Apollo_SDK_2019_for_Windows_v1.1.2_3683/release/release/include"
        ],
        "libraries": [
            "../../Apollo_SDK_2019_for_Windows_v1.1.2_3683/release/release/ApolloSDK.lib",
        ],
        "copies":[{ 
            'destination': './build/Release',
            'files':[
                "../Apollo_SDK_2019_for_Windows_v1.1.2_3683/release/release/ApolloSDK.dll"
            ]
        }],
        "cflags": ["-std=c++11", "-Wall", "-pedantic"]
    }]
}