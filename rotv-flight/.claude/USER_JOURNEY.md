# User Journey
## 1. Systems View
    "Systems available on network" page with a list of available units (ScanFish, Viperfish, Winch) as cards.
    - system cards have a header, body, and footer
    - system cards can be connected and disconnected
    - system cards have a 'select' button, that adds the system to a store-registry of systems.

## 2. Preflight Check
    User can do a preflight check to make sure their system is A-OKAY. Can load 3d model into scene
    - Can load a set of mock preflight-checks from a systems ID
        - preflight-check
        - id
        - nodeRefId
        - title
        -description
        -status
    -Can check each mock preflight-checks to a mock service
        -returns pending, checking, success, and failed. Imagine software tests! ("Battery - Error", "I/O Module - Success","Flap - starboard: pending", "Motionsensor: Pending")

## 3. Operation Dashboard
    This is the view where we look at current systems state.
    Left aside with fieldsets:
        - Parking:
        - Fixed Depth 
        - Follow Seabed
        - Ondulation
    Graph Body
        - has depth monitor and track offset, blasting dummy data
        - has Pitch Roll Flap angles components

    
        