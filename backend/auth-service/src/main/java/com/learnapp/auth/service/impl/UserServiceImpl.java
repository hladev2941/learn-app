package com.learnapp.auth.service.impl;

import com.learnapp.auth.dto.ChangePasswordRequest;
import com.learnapp.auth.dto.LeaderboardEntryDto;
import com.learnapp.auth.dto.UpdateBalanceRequest;
import com.learnapp.auth.dto.UpdateProfileRequest;
import com.learnapp.auth.dto.UserResponse;
import com.learnapp.auth.entity.User;
import com.learnapp.auth.exception.AppException;
import com.learnapp.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UserServiceImpl {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse findById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public UserResponse updateProfile(UUID id, UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        if (request.displayName() != null) user.setDisplayName(request.displayName());
        if (request.timezone() != null)     user.setTimezone(request.timezone());

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void updateBalance(UUID id, UpdateBalanceRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        user.setXpTotal(Math.max(0, user.getXpTotal() + request.xpDelta()));
        user.setCoinBalance(Math.max(0, user.getCoinBalance() + request.coinDelta()));
        userRepository.save(user);
    }

    public String getTimezone(UUID id) {
        return userRepository.findById(id)
                .map(User::getTimezone)
                .orElse("Asia/Ho_Chi_Minh");
    }

    public boolean existsById(UUID id) {
        return userRepository.existsById(id);
    }

    @Transactional
    public void changePassword(UUID id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))
            throw new AppException("Mật khẩu hiện tại không đúng", HttpStatus.BAD_REQUEST);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public List<LeaderboardEntryDto> getLeaderboard(UUID currentUserId) {
        List<User> top10 = userRepository.findTop10ByOrderByXpTotalDesc();
        return IntStream.range(0, top10.size())
                .mapToObj(i -> {
                    User u = top10.get(i);
                    return new LeaderboardEntryDto(
                            i + 1,
                            u.getId(),
                            u.getDisplayName(),
                            u.getAvatarUrl(),
                            u.getXpTotal(),
                            u.getCoinBalance(),
                            u.getId().equals(currentUserId)
                    );
                })
                .toList();
    }
}
