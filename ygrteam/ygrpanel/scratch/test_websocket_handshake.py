import http.client
import ssl

def test_handshake():
    host = "rrgobalitservices.com"
    path = "/ws/chat_call/"
    print(f"Testing HTTPS to WSS upgrade (WebSocket Handshake) on https://{host}{path} ...")
    
    # Setup SSL context
    context = ssl.create_default_context()
    
    try:
        conn = http.client.HTTPSConnection(host, context=context, timeout=10)
        headers = {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
            "Sec-WebSocket-Version": "13",
            "User-Agent": "Python WebSocket Check Agent"
        }
        conn.request("GET", path, headers=headers)
        response = conn.getresponse()
        
        print(f"Response Status Code: {response.status} {response.reason}")
        print("Response Headers:")
        for name, value in response.getheaders():
            print(f"  {name}: {value}")
            
        if response.status == 101:
            print("SUCCESS: Connection upgraded to WebSocket (101 Switching Protocols)")
        else:
            print("FAILED: Connection not upgraded to WebSocket. Server returned status code:", response.status)
            
    except Exception as e:
        print("FAILED: WebSocket connection error:", str(e))

if __name__ == "__main__":
    test_handshake()
