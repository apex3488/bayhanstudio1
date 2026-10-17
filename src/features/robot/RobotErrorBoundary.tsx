import { Component, type ReactNode } from 'react';

interface Props {
  onError: () => void;
  children: ReactNode;
}

/** Any failure in the 3D chunk (load error, shader error) falls back to the poster. */
export class RobotErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn('[robot] 3D scene disabled:', error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
