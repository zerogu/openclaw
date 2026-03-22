#!/usr/bin/env python3
import sys
import os
import boto3
from botocore.exceptions import ClientError

def upload_to_s3(bucket, key, content):
    region = os.environ.get('AWS_REGION', 'prod')
    
    access_key = os.environ.get('BOSS_ACCESS_KEY_ID') or os.environ.get('AWS_ACCESS_KEY_ID')
    secret_key = os.environ.get('BOSS_SECRET_ACCESS_KEY') or os.environ.get('AWS_SECRET_ACCESS_KEY')
    endpoint = os.environ.get('BOSS_ENDPOINT')
    
    if not access_key or not secret_key:
        print("Error: Missing BOSS_ACCESS_KEY_ID or BOSS_SECRET_ACCESS_KEY", file=sys.stderr)
        sys.exit(1)
    
    config = {
        'region_name': region,
        'aws_access_key_id': access_key,
        'aws_secret_access_key': secret_key,
    }
    
    if endpoint:
        config['endpoint_url'] = endpoint
    
    s3_client = boto3.client('s3', **config)
    
    try:
        extra_args = {'ContentType': 'text/html; charset=utf-8'}
        if endpoint:
            extra_args['ACL'] = 'public-read'
        
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            **extra_args
        )
        # 生成URL
        if endpoint:
            url = f"{endpoint}/{bucket}/{key}"
        else:
            url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        print(url)
    except ClientError as e:
        print(f"Error uploading: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    bucket = sys.argv[1] if len(sys.argv) > 1 else 'copilot'
    key = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not key:
        print("Usage: upload-s3.py <bucket> <key>", file=sys.stderr)
        sys.exit(1)
    
    # 读取标准输入
    content = sys.stdin.buffer.read()
    upload_to_s3(bucket, key, content)
