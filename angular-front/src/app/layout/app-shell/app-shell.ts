import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantLauncher } from '../../features/assistant/assistant-launcher/assistant-launcher';
import { ToastHostComponent } from '../../shared/components';
import { Dock } from '../dock/dock';
import { Topbar } from '../topbar/topbar';

/**
 * Authenticated shell: ambient wall + floating header + fixed dock.
 *
 * Pages render inside `.shell__content`; the shell owns the gutters and the
 * room reserved for the dock. The toast host lives here so every page shares
 * one stack.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Topbar, Dock, AssistantLauncher, ToastHostComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
