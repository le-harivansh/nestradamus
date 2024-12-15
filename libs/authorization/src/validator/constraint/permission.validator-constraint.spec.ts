import { Test, TestingModule } from '@nestjs/testing';

import { AUTHORIZATION_PERMISSIONS_CONTAINER } from '../../constant';
import { PermissionContainer } from '../../helper/permission-container';
import { PermissionValidatorConstraint } from './permission.validator-constraint';

jest.mock('../../helper/permission-container');

describe(PermissionValidatorConstraint.name, () => {
  const permissionsContainer = new PermissionContainer(
    {},
    '',
  ) as jest.Mocked<PermissionContainer>;

  let permissionValidatorConstraint: PermissionValidatorConstraint;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHORIZATION_PERMISSIONS_CONTAINER,
          useValue: permissionsContainer,
        },

        PermissionValidatorConstraint,
      ],
    }).compile();

    permissionValidatorConstraint = module.get(PermissionValidatorConstraint);
  });

  describe(PermissionValidatorConstraint.prototype.validate.name, () => {
    const permissions = ['user:create'];

    beforeAll(() => {
      permissionsContainer.getPermissions.mockReturnValue(permissions);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it(`calls '${PermissionContainer.name}::${PermissionContainer.prototype.getPermissions.name}'`, () => {
      permissionValidatorConstraint.validate('');

      expect(permissionsContainer.getPermissions).toHaveBeenCalledTimes(1);
    });

    it.each([
      { expectedResult: true, permission: 'user:create' },
      { expectedResult: false, permission: 'user:update' },
    ])(
      `returns '$expectedResult' if the permission to validate is in the result of '${PermissionContainer.name}::${PermissionContainer.prototype.getPermissions.name}'`,
      ({ expectedResult, permission }) => {
        expect(permissionValidatorConstraint.validate(permission)).toBe(
          expectedResult,
        );
      },
    );
  });
});
