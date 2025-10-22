// ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component<{}, {e:any}> {
  state = { e: null };
  
  componentDidCatch(e: any) { 
    this.setState({ e }); 
    console.error(e); 
  }
  
  render() { 
    return this.state.e ? <div>문제가 발생?�어??</div> : this.props.children; 
  }
}

export default ErrorBoundary; 
