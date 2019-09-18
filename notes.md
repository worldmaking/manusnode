
manus coordinate system has x pointing along bone toward parent (wrist); y pointing up (top of hand), z pointing to left of hand. 
To convert to "normal" GL coordinates: glvec = vec3(-manusvec.z, manusvec.y, manusvec.x)
can use generateMeshMappingFilter() to do this automatically
this actually creates a *new* source for the filtered data, and you would subscribe to that filtered source instead of the original source


in order to obtain data, a dongle has to be connected to the PC on which the Apollo server instance is running, and at least one Manus VR glove has to be powered on and be paired with the active dongle (pairing can be performed via the Apollo User Interface).

generateListSources > sourceListHandler > generateAddStreams (for each endpoint source) > successHandler > generateSetStreamData (for each stream) > sucessHandler(s) > generateStartStreams > successHandler, dataStreamHandlers

query for a list of these source endpoints using the generateListSources fun
> The server should respond to this by invoking the sourceListHandler callback function, passing a list of 64-bit identifiers to it. Each of these endpoints exposes data over the network and can be streamed from. In order to obtain data from a source, a few steps need to be followed first, ho

TODO: may need to pass eventID from js to the generateXX calls, in order to track replies properly
some packets sent by clients may result in the server replying with more than one packet (which all hold the same event ID, though). 

TODO: simplify interface by returning Buffer rather than arraybuffer from the generate() methods?

