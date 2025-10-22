module.exports = {
  apps: [
    { 
      name: 'mcp-bridge', 
      script: 'server.js', 
      env: { 
        NODE_ENV: 'production', 
        TZ: 'Asia/Seoul' 
      } 
    }
  ]
}
