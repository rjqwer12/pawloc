# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

## Supabase OTP email

The signup flow uses `supabase.auth.signInWithOtp()` and the password-reset flow uses `supabase.auth.resetPasswordForEmail()`. Both expect an eight-digit code. Configure the Supabase Auth email OTP length to `8` (valid values are 6 to 10) before testing.

In the Supabase dashboard, configure the **Magic Link** template for sign-up and the **Reset Password / Recovery** template for password resets. Include this token where the code should appear:

```text
Your Pawloc verification code is: {{ .Token }}
```

Do not use only `{{ .ConfirmationURL }}`, because that sends a clickable link instead of displaying the eight-digit code. Save the templates, then request a new OTP. For reliable delivery beyond development limits, configure a custom SMTP provider in Supabase Authentication settings.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
