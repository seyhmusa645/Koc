#!/usr/bin/env python3
"""
Gemini API Test Script
Bu script Gemini API'nin çalışıp çalışmadığını test eder.
"""

import requests
import json
import sys
import argparse

def test_gemini_api(api_key, model="gemini-2.5-flash"):
    """Gemini API'yi test et"""
    
    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent"
    
    headers = {
        "Content-Type": "application/json",
    }
    
    params = {
        "key": api_key
    }
    
    data = {
        "contents": [{
            "parts": [{
                "text": "Merhaba, bu bir test mesajıdır. Lütfen kısa bir yanıt verin."
            }]
        }]
    }
    
    print(f"🔍 Testing Gemini API...")
    print(f"📡 URL: {url}")
    print(f"🤖 Model: {model}")
    print(f"🔑 API Key: {api_key[:10]}...")
    
    try:
        response = requests.post(url, headers=headers, params=params, json=data, timeout=30)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS!")
            print(f"📝 Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0]['content']['parts'][0]['text']
                print(f"\n🤖 AI Response: {content}")
            
            return True
            
        else:
            print(f"❌ ERROR!")
            print(f"📄 Response Text: {response.text}")
            
            try:
                error_data = response.json()
                print(f"🔍 Error Details: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"🔍 Raw Error: {response.text}")
            
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Test Gemini API')
    parser.add_argument('--api-key', required=True, help='Gemini API Key')
    parser.add_argument('--model', default='gemini-2.5-flash', help='Model name (default: gemini-2.5-flash)')
    
    args = parser.parse_args()
    
    success = test_gemini_api(args.api_key, args.model)
    
    if success:
        print(f"\n🎉 Test PASSED!")
        sys.exit(0)
    else:
        print(f"\n💥 Test FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()