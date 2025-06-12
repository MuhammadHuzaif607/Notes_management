// // roles.decorator.ts
// export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// // roles.guard.ts
// @Injectable()
// export class RolesGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     const roles = this.reflector.get<Role[]>('roles', context.getHandler());
//     const user = context.switchToHttp().getRequest().user;
//     return roles.includes(user.role);
//   }
// }
