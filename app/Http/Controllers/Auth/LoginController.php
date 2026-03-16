<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        if (Auth::check()) {
            return redirect()->route('home');
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        $user = \App\Models\User::where('email', $request->email)->first();
        if ($user && !$user->is_active) {
            if ($request->wantsJson()) {
                throw ValidationException::withMessages(['email' => ['Учетная запись отключена.']]);
            }
            return back()->withErrors(['email' => 'Учетная запись отключена.'])->withInput();
        }

        if (!Auth::attempt($credentials, $remember)) {
            if ($request->wantsJson()) {
                throw ValidationException::withMessages(['email' => ['Неверный email или пароль.']]);
            }
            return back()->withErrors(['email' => 'Неверный email или пароль.'])->withInput();
        }

        $request->session()->regenerate();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'user' => $this->mapUser(Auth::user()),
            ]);
        }

        return redirect()->intended(route('home'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }
        return redirect()->route('login');
    }

    private function mapUser($user): array
    {
        $user->load('department');
        $roleMap = ['admin' => 'Администратор', 'editor' => 'Редактор', 'user' => 'Пользователь'];
        return [
            'id' => $user->id,
            'user_id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name ?? $user->name,
            'name' => $user->full_name ?? $user->name,
            'role' => $roleMap[$user->role] ?? $user->role,
            'position' => $user->position ?? '',
            'phone' => $user->phone ?? '',
            'department' => $user->department?->name ?? '',
            'department_id' => $user->department_id,
            'is_active' => $user->is_active,
        ];
    }
}
