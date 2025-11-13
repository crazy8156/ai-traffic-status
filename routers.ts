      }
    }),
    
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getLocalUserByUsername(input.username);
        
        if (!user) {
          throw new Error("帳號或密碼錯誤");
        }
        
        const isValid = await bcrypt.compare(input.password, user.password);
        
        if (!isValid) {
          throw new Error("帳號或密碼錯誤");
        }
        
        await db.updateLocalUserLastLogin(user.id);
        
        const token = jwt.sign({ userId: user.id }, ENV.jwtSecret, { expiresIn: "7d" });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
        
        return {
          success: true,
          user: { id: user.id, name: user.name, role: user.role },
        };
      }),
    