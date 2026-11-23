"use client";

import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
  onError?: (err: Error) => void;
}

/** Keeps a failing WebGL scene from taking the whole page down. */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err: Error) {
    console.warn("[scene]", err);
    this.props.onError?.(err);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
