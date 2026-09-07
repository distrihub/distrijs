import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import React from 'react'
import { PushToTalkButton } from '../components/PushToTalkButton'

function makeVoice(state: 'idle' | 'ready' | 'listening' | 'speaking' | 'error' = 'ready') {
  return {
    state,
    transcript: { interim: '', finals: [] },
    press: vi.fn(),
    release: vi.fn(),
    cancel: vi.fn(),
  }
}

describe('PushToTalkButton', () => {
  afterEach(() => cleanup())

  it('pointerdown calls press and pointerup calls release', () => {
    const voice = makeVoice()
    const { getByTestId } = render(<PushToTalkButton voice={voice} />)
    const button = getByTestId('push-to-talk')

    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'touch', button: 0 })
    expect(voice.press).toHaveBeenCalledTimes(1)
    expect(button).toHaveAttribute('aria-pressed', 'true')

    fireEvent.pointerUp(button, { pointerId: 1 })
    expect(voice.release).toHaveBeenCalledTimes(1)
    expect(voice.cancel).not.toHaveBeenCalled()
  })

  it('pointercancel and a pointer leaving by more than 48 px cancel the turn', () => {
    const voice = makeVoice()
    const { getByTestId } = render(<PushToTalkButton voice={voice} />)
    const button = getByTestId('push-to-talk')
    button.getBoundingClientRect = () => ({ left: 0, top: 0, right: 40, bottom: 40, width: 40, height: 40, x: 0, y: 0, toJSON: () => ({}) })

    fireEvent.pointerDown(button, { pointerId: 1, button: 0 })
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 20, clientY: 60 }) // 20 px below: still held
    expect(voice.cancel).not.toHaveBeenCalled()
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 20, clientY: 120 }) // 80 px below: cancelled
    expect(voice.cancel).toHaveBeenCalledTimes(1)
    fireEvent.pointerUp(button, { pointerId: 1 })
    expect(voice.release).not.toHaveBeenCalled()

    fireEvent.pointerDown(button, { pointerId: 2, button: 0 })
    fireEvent.pointerCancel(button, { pointerId: 2 })
    expect(voice.cancel).toHaveBeenCalledTimes(2)
  })

  it('suppresses the context menu and ignores right-clicks', () => {
    const voice = makeVoice()
    const { getByTestId } = render(<PushToTalkButton voice={voice} />)
    const button = getByTestId('push-to-talk')
    const ctx = fireEvent.contextMenu(button)
    expect(ctx).toBe(false) // preventDefault was called
    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 2 })
    expect(voice.press).not.toHaveBeenCalled()
  })

  it('pushToTalkKey presses while focus is outside editable elements', () => {
    const voice = makeVoice()
    const { getByTestId } = render(
      <div>
        <input data-testid="field" />
        <PushToTalkButton voice={voice} pushToTalkKey="Space" />
      </div>,
    )
    fireEvent.keyDown(document.body, { code: 'Space' })
    expect(voice.press).toHaveBeenCalledTimes(1)
    fireEvent.keyUp(document.body, { code: 'Space' })
    expect(voice.release).toHaveBeenCalledTimes(1)

    const field = getByTestId('field')
    field.focus()
    fireEvent.keyDown(field, { code: 'Space' })
    expect(voice.press).toHaveBeenCalledTimes(1) // typing a space is not a press
  })

  it('reflects the voice state in data-voice-state and title', () => {
    const { getByTestId, rerender } = render(<PushToTalkButton voice={makeVoice('speaking')} />)
    expect(getByTestId('push-to-talk')).toHaveAttribute('data-voice-state', 'speaking')
    expect(getByTestId('push-to-talk')).toHaveAttribute('title', 'Speaking — press to interrupt')
    rerender(<PushToTalkButton voice={makeVoice('error')} />)
    expect(getByTestId('push-to-talk')).toHaveAttribute('data-voice-state', 'error')
  })
})
